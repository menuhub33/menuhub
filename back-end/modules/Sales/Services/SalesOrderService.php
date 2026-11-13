<?php

namespace Modules\Sales\Services;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Modules\Catalog\Models\Product;
use Modules\Inventory\Services\InventoryService;
use Modules\Operations\Models\Branch;
use Modules\Orders\Models\Order;
use Modules\Orders\Models\OrderItem;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Enums\SalesChannel;
use Modules\Shared\Enums\SalesPaymentStatus;
use Modules\Shared\Events\ActivityRecorded;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Money;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;

/**
 * Creates and cancels sales documents for the POS, STAFF and EXTERNAL channels.
 * QR orders keep going through the existing OrderService.
 */
class SalesOrderService
{
    public function __construct(
        private readonly InventoryService $inventory,
        private readonly PaymentService $payments,
    ) {}

    /**
     * Creates a CONFIRMED invoice, takes the stock out and (optionally) records the payment,
     * all in one transaction.
     *
     * @param  array<string, mixed>  $data  validated payload (see SalesOrderController::store)
     * @param  string|null  $memberBranchId  branch the acting member is restricted to
     */
    public function create(Restaurant $restaurant, User $actor, array $data, ?string $memberBranchId = null): Order
    {
        $key = $data['client_request_id'] ?? null;
        $hash = hash('sha256', json_encode([
            $data['channel'], $data['order_type'], $data['table_number'] ?? null, $data['branch_id'] ?? null,
            $data['address'] ?? null, $data['notes'] ?? null, $data['items'], $data['discount'] ?? null,
            $data['payment'] ?? null,
        ]));

        if ($key !== null && ($replay = $this->replay($restaurant->id, $key, $hash))) {
            return $replay;
        }

        $branch = $this->resolveBranch($restaurant, $data['branch_id'] ?? null, $memberBranchId);
        $lines = $this->buildLines($restaurant, $data['items']);
        $totals = $this->price($lines, $data['discount'] ?? null);

        try {
            return DB::transaction(function () use ($restaurant, $actor, $data, $branch, $lines, $totals, $key, $hash) {
                $order = Order::query()->create([
                    'restaurant_id' => $restaurant->id,
                    'number' => $this->nextNumber($restaurant->id),
                    'status' => OrderStatus::Confirmed,
                    'channel' => SalesChannel::from($data['channel']),
                    'payment_status' => SalesPaymentStatus::Unpaid,
                    'is_legacy' => false,
                    'delivery_type' => array_search($data['order_type'], Order::ORDER_TYPES, true),
                    'branch_id' => $branch?->id,
                    'branch_name' => $branch?->name,
                    'table_number' => $data['table_number'] ?? null,
                    'address' => $data['address'] ?? null,
                    'notes' => $data['notes'] ?? null,
                    'currency' => $restaurant->currency,
                    'subtotal' => Money::format($totals['subtotal']),
                    'discount_total' => Money::format($totals['discount']),
                    'discount_approved_by' => $totals['discount'] > 0 ? $actor->getKey() : null,
                    'discount_note' => $data['discount']['note'] ?? null,
                    'total' => Money::format($totals['total']),
                    'opened_by' => $actor->getKey(),
                    'confirmed_by' => $actor->getKey(),
                    'confirmed_at' => now(),
                    'client_request_id' => $key,
                    'request_hash' => $hash,
                ]);

                foreach ($lines as $index => $line) {
                    OrderItem::query()->create([
                        'order_id' => $order->id,
                        'product_id' => $line['product']->id,
                        'name_ar' => $line['product']->name_ar,
                        'quantity' => $line['quantity'],
                        'unit_price' => Money::format($line['unit']),
                        'extra' => '0.00',
                        'line_total' => Money::format($line['line_total']),
                        'discount_total' => Money::format($line['discount']),
                        'line_net' => Money::format($totals['net'][$index]),
                        'note' => $line['note'],
                        'cost_snapshot' => $line['product']->cost_price,
                        'category_id_snapshot' => $line['product']->category_id,
                        'category_name_snapshot' => $line['product']->category?->name_ar,
                    ]);
                }

                $this->inventory->deduct($order, $actor->getKey());
                $this->payments->recalculate($order);

                if (! empty($data['payment'])) {
                    $this->payments->collect($order, $actor, $data['payment'] + [
                        'client_request_id' => $key ? $this->derivedKey($key) : null,
                    ]);
                }

                event(new ActivityRecorded(
                    restaurantId: $restaurant->id,
                    userId: $actor->getKey(),
                    action: 'sale.created',
                    entityType: 'order',
                    entityId: $order->id,
                    new: [
                        'number' => $order->number,
                        'channel' => $data['channel'],
                        'total' => $order->total,
                        'discount_total' => $order->discount_total,
                    ],
                ));

                return $order->refresh();
            });
        } catch (UniqueConstraintViolationException) {
            if ($key !== null && ($replay = $this->replay($restaurant->id, $key, $hash))) {
                return $replay;
            }

            throw ApiException::conflict('تعذر إنشاء الفاتورة، أعد المحاولة', 'CONFLICT');
        }
    }

    /**
     * Cancels a confirmed invoice. A paid invoice must be refunded first
     * (done here, atomically, when `refund_method` is given).
     */
    public function cancel(Order $order, User $actor, string $reason, ?string $refundMethod = null): Order
    {
        return DB::transaction(function () use ($order, $actor, $reason, $refundMethod) {
            $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

            if ($locked->status === OrderStatus::Cancelled) {
                return $locked;
            }
            if ($locked->status !== OrderStatus::Confirmed) {
                throw ApiException::invalid('يمكن إلغاء الفواتير المثبتة فقط', 'INVALID_TRANSITION');
            }
            if ($locked->inventory_deducted_at === null) {
                // Confirmed through the legacy QR path which did not mark the stock deduction.
                throw ApiException::invalid('إلغاء هذه الفاتورة غير مدعوم بعد', 'CANCEL_NOT_SUPPORTED_YET');
            }

            $net = Money::cents($locked->paid_amount) - Money::cents($locked->refunded_amount);
            if ($net > 0) {
                if (! $refundMethod) {
                    throw ApiException::invalid('يجب استرداد المبلغ المحصّل قبل الإلغاء', 'REFUND_REQUIRED_BEFORE_CANCEL');
                }

                $this->payments->refund($locked, $actor, [
                    'method' => $refundMethod,
                    'amount' => Money::format($net),
                    'reason' => $reason,
                ]);
                $locked->refresh();
            }

            $this->inventory->restore($locked, $actor->getKey());

            $locked->forceFill([
                'status' => OrderStatus::Cancelled,
                'cancelled_at' => now(),
                'cancelled_by' => $actor->getKey(),
                'cancel_reason' => $reason,
            ])->save();

            event(new ActivityRecorded(
                restaurantId: $locked->restaurant_id,
                userId: $actor->getKey(),
                action: 'sale.cancelled',
                entityType: 'order',
                entityId: $locked->id,
                new: ['number' => $locked->number, 'reason' => $reason, 'refunded' => Money::format(max(0, $net))],
            ));

            $order->setRawAttributes($locked->getAttributes(), true);

            return $locked;
        });
    }

    private function replay(string $restaurantId, string $key, string $hash): ?Order
    {
        $existing = Order::query()
            ->where('restaurant_id', $restaurantId)
            ->where('client_request_id', $key)
            ->first();

        if (! $existing) {
            return null;
        }
        if ($existing->request_hash !== $hash) {
            throw ApiException::conflict('مفتاح التكرار مستخدم مع بيانات مختلفة', 'IDEMPOTENCY_KEY_REUSED');
        }

        return $existing;
    }

    /** The payment taken together with the invoice gets its own deterministic key. */
    private function derivedKey(string $key): string
    {
        $hex = substr(hash('sha256', 'payment:'.$key), 0, 32);

        return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20, 12));
    }

    private function resolveBranch(Restaurant $restaurant, ?string $branchId, ?string $memberBranchId): ?Branch
    {
        if ($memberBranchId !== null) {
            if ($branchId !== null && $branchId !== $memberBranchId) {
                throw ApiException::forbidden('لا يمكنك البيع خارج فرعك', 'BRANCH_FORBIDDEN');
            }
            $branchId = $memberBranchId;
        }

        if ($branchId === null) {
            return null;
        }

        return Branch::query()->where('restaurant_id', $restaurant->id)->whereKey($branchId)->first()
            ?? throw ApiException::invalid('الفرع غير موجود', 'INVALID_BRANCH');
    }

    /**
     * Reads every product from the DB (prices are never taken from the client).
     *
     * @param  list<array<string, mixed>>  $items
     * @return list<array{product:Product,quantity:int,unit:int,line_total:int,discount:int,note:?string}>
     */
    private function buildLines(Restaurant $restaurant, array $items): array
    {
        $merged = [];
        foreach ($items as $item) {
            $signature = $item['product_id'].'|'.($item['note'] ?? '').'|'.json_encode($item['discount'] ?? null);
            if (isset($merged[$signature])) {
                $merged[$signature]['quantity'] += (int) $item['quantity'];
            } else {
                $merged[$signature] = $item + ['note' => null, 'discount' => null];
                $merged[$signature]['quantity'] = (int) $item['quantity'];
            }
        }

        /** @var Collection<string, Product> $products */
        $products = Product::query()
            ->forRestaurant($restaurant->id)
            ->with('category')
            ->whereIn('id', collect($merged)->pluck('product_id')->unique()->all())
            ->get()
            ->keyBy('id');

        $lines = [];
        foreach ($merged as $item) {
            $product = $products->get($item['product_id']);

            if (! $product || $product->status !== ProductStatus::Available || ! $product->category?->is_active
                || $product->price === null || Money::cents($product->price) <= 0) {
                $name = $product?->name_ar ?? 'منتج';
                throw new ApiException("المنتج {$name} غير متاح للبيع", 422, 'PRODUCT_NOT_SELLABLE', ['product_id' => $item['product_id']]);
            }
            if ($product->currency !== $restaurant->currency) {
                throw ApiException::invalid('لا يمكن خلط عملات مختلفة في فاتورة واحدة', 'MIXED_CURRENCY');
            }
            if ($product->stock_quantity !== null && $product->stock_quantity < $item['quantity']) {
                throw new ApiException(
                    "الكمية المتبقية من {$product->name_ar} هي {$product->stock_quantity}",
                    422,
                    'INSUFFICIENT_STOCK',
                    ['product_id' => $product->id, 'available' => (int) $product->stock_quantity],
                );
            }

            $unit = Money::cents($product->price);
            $lineTotal = $unit * $item['quantity'];

            $lines[] = [
                'product' => $product,
                'quantity' => $item['quantity'],
                'unit' => $unit,
                'line_total' => $lineTotal,
                'discount' => $this->discountAmount($item['discount'], $lineTotal),
                'note' => $item['note'] ?? null,
            ];
        }

        return $lines;
    }

    /**
     * @param  list<array{line_total:int,discount:int}>  $lines
     * @param  array{type?:string,value?:mixed}|null  $discount
     * @return array{subtotal:int,discount:int,total:int,net:list<int>}
     */
    private function price(array $lines, ?array $discount): array
    {
        $subtotal = array_sum(array_column($lines, 'line_total'));
        $itemDiscounts = array_sum(array_column($lines, 'discount'));
        $base = $subtotal - $itemDiscounts;

        $orderDiscount = $this->discountAmount($discount, $base);

        // Spread the order discount over the lines proportionally (floor), then hand the few
        // leftover cents out one by one so that SUM(line_net) always equals the invoice total.
        $bases = [];
        $shares = [];
        foreach ($lines as $index => $line) {
            $bases[$index] = $line['line_total'] - $line['discount'];
            $shares[$index] = $base > 0 ? intdiv($orderDiscount * $bases[$index], $base) : 0;
        }

        $left = $orderDiscount - array_sum($shares);
        while ($left > 0) {
            $progressed = false;
            foreach ($shares as $index => $share) {
                if ($left > 0 && $share < $bases[$index]) {
                    $shares[$index]++;
                    $left--;
                    $progressed = true;
                }
            }
            if (! $progressed) {
                break;
            }
        }

        $net = [];
        foreach ($bases as $index => $lineBase) {
            $net[$index] = $lineBase - $shares[$index];
        }

        return [
            'subtotal' => $subtotal,
            'discount' => $itemDiscounts + $orderDiscount,
            'total' => $base - $orderDiscount,
            'net' => $net,
        ];
    }

    /** @param  array{type?:string,value?:mixed}|null  $discount */
    private function discountAmount(?array $discount, int $base): int
    {
        if (! $discount || ! isset($discount['value'])) {
            return 0;
        }

        $amount = ($discount['type'] ?? 'FIXED') === 'PERCENT'
            ? Money::percentOf($base, $discount['value'])
            : Money::cents($discount['value']);

        if ($amount < 0 || $amount > $base) {
            throw ApiException::invalid('قيمة الخصم غير صالحة', 'INVALID_DISCOUNT');
        }

        return $amount;
    }

    /** Sequential per-restaurant invoice number (S-000123). */
    private function nextNumber(string $restaurantId): string
    {
        DB::table('sales_counters')->insertOrIgnore(['restaurant_id' => $restaurantId, 'last_number' => 0]);

        $row = DB::table('sales_counters')->where('restaurant_id', $restaurantId)->lockForUpdate()->first();
        $next = ((int) $row->last_number) + 1;

        DB::table('sales_counters')->where('restaurant_id', $restaurantId)->update(['last_number' => $next]);

        return 'S-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
