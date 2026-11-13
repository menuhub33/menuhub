<?php

namespace Modules\Sales\Services;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\DB;
use Modules\Orders\Models\Order;
use Modules\Sales\Models\OrderPayment;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Enums\PaymentMethod;
use Modules\Shared\Enums\PaymentType;
use Modules\Shared\Enums\SalesPaymentStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Money;
use Modules\Users\Models\User;

/**
 * Collections and refunds. `order_payments` is the only source of truth;
 * `orders.paid_amount / refunded_amount / payment_status` are caches that
 * are rewritten here, in the same transaction, from the ledger sums.
 */
class PaymentService
{
    /**
     * @param  array{method:string,amount?:mixed,tendered_amount?:mixed,reference?:?string,notes?:?string,client_request_id?:?string}  $data
     */
    public function collect(Order $order, User $actor, array $data): OrderPayment
    {
        return $this->record($order, $actor, PaymentType::Collection, $data);
    }

    /**
     * @param  array{method:string,amount?:mixed,reason?:?string,reference?:?string,notes?:?string,client_request_id?:?string}  $data
     */
    public function refund(Order $order, User $actor, array $data): OrderPayment
    {
        return $this->record($order, $actor, PaymentType::Refund, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function record(Order $order, User $actor, PaymentType $type, array $data): OrderPayment
    {
        $key = $data['client_request_id'] ?? null;
        $hash = hash('sha256', json_encode([
            $order->id, $type->value, $data['method'] ?? null, Money::cents($data['amount'] ?? 0),
            Money::cents($data['tendered_amount'] ?? 0), $data['reference'] ?? null,
        ]));

        try {
            return DB::transaction(function () use ($order, $actor, $type, $data, $key, $hash) {
                $locked = Order::query()->whereKey($order->id)->lockForUpdate()->firstOrFail();

                if ($key !== null) {
                    $existing = OrderPayment::query()
                        ->where('restaurant_id', $locked->restaurant_id)
                        ->where('client_request_id', $key)
                        ->first();
                    if ($existing) {
                        $this->assertSameRequest($existing, $locked, $hash);

                        return $existing;
                    }
                }

                $method = PaymentMethod::tryFrom((string) ($data['method'] ?? ''))
                    ?? throw ApiException::invalid('طريقة الدفع غير صالحة');

                $payment = $type === PaymentType::Collection
                    ? $this->collection($locked, $actor, $method, $data, $key, $hash)
                    : $this->refunding($locked, $actor, $method, $data, $key, $hash);

                $this->recalculate($locked, $type === PaymentType::Collection ? $actor : null);
                $order->setRawAttributes($locked->getAttributes(), true);

                return $payment;
            });
        } catch (UniqueConstraintViolationException) {
            // The same key was just used for another order.
            throw ApiException::conflict('مفتاح التكرار مستخدم لعملية أخرى', 'IDEMPOTENCY_KEY_REUSED');
        }
    }

    private function collection(Order $order, User $actor, PaymentMethod $method, array $data, ?string $key, string $hash): OrderPayment
    {
        if ($order->status !== OrderStatus::Confirmed) {
            throw ApiException::invalid('لا يمكن التحصيل إلا على فاتورة مثبتة', 'ORDER_NOT_COLLECTABLE');
        }

        if ($order->items()->whereNull('line_total')->exists()) {
            throw ApiException::invalid('الفاتورة تحتوي بنوداً بلا سعر ويجب تسعيرها قبل التحصيل', 'ORDER_HAS_UNPRICED_ITEMS');
        }

        $due = Money::cents($order->total) - Money::cents($order->paid_amount);
        $amount = array_key_exists('amount', $data) && $data['amount'] !== null
            ? Money::cents($data['amount'])
            : $due;

        if ($amount <= 0) {
            throw ApiException::invalid('المبلغ يجب أن يكون أكبر من صفر', 'INVALID_AMOUNT');
        }
        if ($amount > $due) {
            throw new ApiException('المبلغ أكبر من الرصيد المستحق', 422, 'OVERPAYMENT', ['balance_due' => Money::format(max(0, $due))]);
        }

        $tendered = $change = null;
        if ($method === PaymentMethod::Cash && ($data['tendered_amount'] ?? null) !== null) {
            $tendered = Money::cents($data['tendered_amount']);
            if ($tendered < $amount) {
                throw ApiException::invalid('المبلغ المستلم أقل من المطلوب', 'INVALID_AMOUNT');
            }
            $change = $tendered - $amount;
        }

        return OrderPayment::query()->create([
            'restaurant_id' => $order->restaurant_id,
            'order_id' => $order->id,
            'type' => PaymentType::Collection,
            'method' => $method,
            'amount' => Money::format($amount),
            'tendered_amount' => $tendered === null ? null : Money::format($tendered),
            'change_amount' => $change === null ? null : Money::format($change),
            'notes' => $data['notes'] ?? null,
            'reference' => $data['reference'] ?? null,
            'created_by' => $actor->getKey(),
            'branch_id' => $order->branch_id,
            'client_request_id' => $key,
            'request_hash' => $hash,
        ]);
    }

    private function refunding(Order $order, User $actor, PaymentMethod $method, array $data, ?string $key, string $hash): OrderPayment
    {
        if (! in_array($order->status, [OrderStatus::Confirmed, OrderStatus::Cancelled], true)) {
            throw ApiException::invalid('لا يمكن الاسترداد على هذه الفاتورة', 'ORDER_NOT_COLLECTABLE');
        }

        $refundable = Money::cents($order->paid_amount) - Money::cents($order->refunded_amount);
        $amount = array_key_exists('amount', $data) && $data['amount'] !== null
            ? Money::cents($data['amount'])
            : $refundable;

        if ($amount <= 0) {
            throw ApiException::invalid('المبلغ يجب أن يكون أكبر من صفر', 'INVALID_AMOUNT');
        }
        if ($amount > $refundable) {
            throw new ApiException('مبلغ الاسترداد أكبر من المبلغ المحصّل', 422, 'REFUND_EXCEEDS_PAID', ['refundable' => Money::format(max(0, $refundable))]);
        }

        return OrderPayment::query()->create([
            'restaurant_id' => $order->restaurant_id,
            'order_id' => $order->id,
            'type' => PaymentType::Refund,
            'method' => $method,
            'amount' => Money::format($amount),
            'reason' => $data['reason'] ?? null,
            'notes' => $data['notes'] ?? null,
            'reference' => $data['reference'] ?? null,
            'created_by' => $actor->getKey(),
            'branch_id' => $order->branch_id,
            'client_request_id' => $key,
            'request_hash' => $hash,
        ]);
    }

    /**
     * Rewrites the cached money columns from the ledger. Call under the order row lock.
     */
    public function recalculate(Order $order, ?User $collector = null): void
    {
        $sums = OrderPayment::query()
            ->where('order_id', $order->id)
            ->selectRaw('type, SUM(amount) as total')
            ->groupBy('type')
            ->pluck('total', 'type');

        $paid = Money::cents($sums[PaymentType::Collection->value] ?? 0);
        $refunded = Money::cents($sums[PaymentType::Refund->value] ?? 0);
        $total = Money::cents($order->total);

        $status = match (true) {
            $paid === 0 => $total === 0 ? SalesPaymentStatus::Paid : SalesPaymentStatus::Unpaid,
            $refunded === $paid => SalesPaymentStatus::Refunded,
            $paid >= $total => SalesPaymentStatus::Paid,
            default => SalesPaymentStatus::Partial,
        };

        $attributes = [
            'paid_amount' => Money::format($paid),
            'refunded_amount' => Money::format($refunded),
            'payment_status' => $status,
        ];

        if ($status === SalesPaymentStatus::Paid && $order->paid_at === null) {
            $attributes['paid_at'] = now();
        }
        if ($collector) {
            $attributes['cashier_id'] = $collector->getKey();
        }

        $order->forceFill($attributes)->save();
    }

    private function assertSameRequest(OrderPayment $existing, Order $order, string $hash): void
    {
        if ($existing->order_id !== $order->id || $existing->request_hash !== $hash) {
            throw ApiException::conflict('مفتاح التكرار مستخدم مع بيانات مختلفة', 'IDEMPOTENCY_KEY_REUSED');
        }
    }
}
