<?php

namespace Modules\Sales\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Product;
use Modules\Orders\Models\Order;
use Modules\Sales\Http\Resources\SalesOrderResource;
use Modules\Sales\Services\SalesOrderService;
use Modules\Sales\Support\BranchScope;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Enums\PaymentMethod;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Enums\SalesChannel;
use Modules\Shared\Enums\SalesPaymentStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Support\Money;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Support\TenantContext;
use Modules\Users\Models\User;

class SalesOrderController extends ApiController
{
    public function __construct(private readonly SalesOrderService $sales) {}

    /** Lightweight catalog for the POS / waiter screens. */
    public function catalog(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'uuid'],
        ]);

        $categories = Category::query()
            ->forRestaurant($restaurant->id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get(['id', 'name_ar', 'sort_order']);

        $products = Product::query()
            ->forRestaurant($restaurant->id)
            ->with(['images' => fn ($query) => $query->limit(1)])
            ->where('status', ProductStatus::Available->value)
            ->whereHas('category', fn ($query) => $query->where('is_active', true))
            ->when($request->query('category_id'), fn ($query, $id) => $query->where('category_id', $id))
            ->when($request->query('q'), fn ($query, $q) => $query->where('name_ar', 'like', '%'.addcslashes($q, '%_\\').'%'))
            ->orderBy('sort_order')
            ->orderBy('name_ar')
            ->paginate($this->perPage(60, 200));

        $rows = $products->getCollection()->map(function (Product $product) use ($restaurant) {
            $reason = match (true) {
                $product->price === null || Money::cents($product->price) <= 0 => 'NO_PRICE',
                $product->currency !== $restaurant->currency => 'CURRENCY',
                $product->stock_quantity !== null && $product->stock_quantity <= 0 => 'OUT_OF_STOCK',
                default => null,
            };

            return [
                'id' => $product->id,
                'category_id' => $product->category_id,
                'name_ar' => $product->name_ar,
                'price' => $product->price === null ? null : (float) $product->price,
                'currency' => $product->currency,
                'stock_quantity' => $product->stock_quantity === null ? null : (int) $product->stock_quantity,
                'image_url' => $product->images->first()?->image_url,
                'sellable' => $reason === null,
                'unsellable_reason' => $reason,
            ];
        })->values();

        return $this->ok(
            ['categories' => $categories, 'products' => $rows],
            meta: [
                'page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'last_page' => $products->lastPage(),
            ],
        );
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $tenant = TenantContext::current();
        $data = $request->validate([
            'channel' => ['required', Rule::in([SalesChannel::Pos->value, SalesChannel::Staff->value, SalesChannel::External->value])],
            'order_type' => ['required', Rule::in(array_values(Order::ORDER_TYPES))],
            'table_number' => ['nullable', 'required_if:order_type,DINE_IN', 'string', 'max:50'],
            'address' => ['nullable', 'required_if:order_type,DELIVERY', 'string', 'max:1000'],
            'branch_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.product_id' => ['required', 'uuid'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:9999'],
            'items.*.note' => ['nullable', 'string', 'max:500'],
            'items.*.discount' => ['nullable', 'array'],
            'items.*.discount.type' => ['required_with:items.*.discount', Rule::in(['FIXED', 'PERCENT'])],
            'items.*.discount.value' => ['required_with:items.*.discount', 'numeric', 'min:0'],
            'discount' => ['nullable', 'array'],
            'discount.type' => ['required_with:discount', Rule::in(['FIXED', 'PERCENT'])],
            'discount.value' => ['required_with:discount', 'numeric', 'min:0'],
            'discount.note' => ['nullable', 'string', 'max:255'],
            'payment' => ['nullable', 'array'],
            'payment.method' => ['required_with:payment', Rule::enum(PaymentMethod::class)],
            'payment.amount' => ['nullable', 'numeric', 'gt:0'],
            'payment.tendered_amount' => ['nullable', 'numeric', 'gt:0'],
            'payment.reference' => ['nullable', 'string', 'max:100'],
            'payment.notes' => ['nullable', 'string', 'max:500'],
        ]);

        // The channel decides which permission is needed: the waiter screen can only create STAFF orders.
        $needed = $data['channel'] === SalesChannel::Staff->value ? 'sales.create_staff' : 'sales.create';
        if (! $tenant->can($needed) && ! ($needed === 'sales.create_staff' && $tenant->can('sales.create'))) {
            throw ApiException::forbidden('ليست لديك صلاحية لتنفيذ هذا الإجراء', 'MISSING_PERMISSION');
        }

        if ($data['channel'] === SalesChannel::Staff->value && ! $restaurant->pos_mode->waiterEnabled()) {
            throw ApiException::forbidden('شاشة النادل غير مفعّلة لهذا المحل', 'WAITER_NOT_ENABLED');
        }

        $hasDiscount = ! empty($data['discount'])
            || collect($data['items'])->contains(fn ($item) => ! empty($item['discount']));
        if ($hasDiscount && ! $tenant->can('sales.discount')) {
            throw ApiException::forbidden('الخصم غير مسموح لحسابك', 'DISCOUNT_NOT_ALLOWED');
        }
        if (! empty($data['payment']) && ! $tenant->can('sales.collect')) {
            throw ApiException::forbidden('التحصيل غير مسموح لحسابك', 'MISSING_PERMISSION');
        }

        $data['client_request_id'] = $this->idempotencyKey($request);

        $order = $this->sales->create($restaurant, $request->user(), $data, BranchScope::memberBranch());
        $order->load(['items', 'payments', 'opener']);

        $response = $this->ok(new SalesOrderResource($order), $order->wasRecentlyCreated ? 201 : 200);

        return $order->wasRecentlyCreated ? $response : $response->header('Idempotent-Replay', 'true');
    }

    public function index(Request $request, Restaurant $restaurant): mixed
    {
        $filters = $request->validate([
            'number' => ['nullable', 'string', 'max:30'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'branch_id' => ['nullable', 'uuid'],
            'channel' => ['nullable', Rule::enum(SalesChannel::class)],
            'order_type' => ['nullable', Rule::in(array_values(Order::ORDER_TYPES))],
            'fulfillment_status' => ['nullable', Rule::in(['OPEN', 'CONFIRMED', 'CANCELLED', 'REJECTED'])],
            'payment_status' => ['nullable', Rule::enum(SalesPaymentStatus::class)],
            'opened_by' => ['nullable', 'uuid'],
            'cashier_id' => ['nullable', 'uuid'],
            'include_legacy' => ['nullable', 'boolean'],
        ]);

        $query = $this->ledger($restaurant)
            ->when($filters['number'] ?? null, fn ($q, $number) => $q->where('number', 'like', addcslashes($number, '%_\\').'%'))
            ->when($filters['branch_id'] ?? null, fn ($q, $id) => $q->where('branch_id', $id))
            ->when($filters['channel'] ?? null, fn ($q, $channel) => $q->where('channel', $channel))
            ->when($filters['order_type'] ?? null, fn ($q, $type) => $q->where('delivery_type', array_search($type, Order::ORDER_TYPES, true)))
            ->when($filters['fulfillment_status'] ?? null, fn ($q, $status) => $q->where('status', $status === 'OPEN' ? OrderStatus::Pending->value : $status))
            ->when($filters['payment_status'] ?? null, fn ($q, $status) => $q->where('payment_status', $status))
            ->when($filters['opened_by'] ?? null, fn ($q, $id) => $q->where('opened_by', $id))
            ->when($filters['cashier_id'] ?? null, fn ($q, $id) => $q->where('cashier_id', $id));

        if (array_key_exists('include_legacy', $filters) && ! filter_var($filters['include_legacy'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_legacy', false);
        }

        $zone = $restaurant->timezone ?: 'UTC';
        if (! empty($filters['from'])) {
            $query->where('created_at', '>=', Carbon::parse($filters['from'], $zone)->startOfDay()->utc());
        }
        if (! empty($filters['to'])) {
            $query->where('created_at', '<=', Carbon::parse($filters['to'], $zone)->endOfDay()->utc());
        }

        return SalesOrderResource::collection(
            $query->with(['opener'])->latest()->paginate($this->perPage(30))
        );
    }

    /** Confirmed invoices that still wait for the cashier (waiter / QR / external orders). */
    public function unpaid(Request $request, Restaurant $restaurant): mixed
    {
        $orders = $this->ledger($restaurant)
            ->where('status', OrderStatus::Confirmed->value)
            ->where('is_legacy', false)
            ->whereIn('payment_status', [SalesPaymentStatus::Unpaid->value, SalesPaymentStatus::Partial->value])
            ->with(['items', 'opener'])
            ->latest()
            ->paginate($this->perPage(30));

        return SalesOrderResource::collection($orders);
    }

    public function show(Restaurant $restaurant, Order $sale): JsonResponse
    {
        BranchScope::assertAccessible($sale);

        return $this->ok(new SalesOrderResource($sale->load(['items', 'payments', 'opener'])));
    }

    public function receipt(Restaurant $restaurant, Order $sale): JsonResponse
    {
        BranchScope::assertAccessible($sale);
        $sale->load(['items', 'payments', 'opener']);

        $zone = $restaurant->timezone ?: 'UTC';
        $cashier = $sale->cashier_id ? User::query()->find($sale->cashier_id) : null;

        return $this->ok([
            'restaurant' => [
                'name' => $restaurant->name,
                'logo_url' => $restaurant->logo_url,
                'phone' => $restaurant->phone,
                'address' => $restaurant->address,
                'currency' => $restaurant->currency,
                'timezone' => $zone,
            ],
            'branch' => $sale->branch_name,
            'issued_at_local' => $sale->confirmed_at?->copy()->setTimezone($zone)->format('Y-m-d H:i'),
            'employee' => $cashier?->full_name ?? $sale->opener?->full_name,
            'order' => new SalesOrderResource($sale),
        ]);
    }

    public function cancel(Request $request, Restaurant $restaurant, Order $sale): JsonResponse
    {
        BranchScope::assertAccessible($sale);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:3', 'max:500'],
            'refund_method' => ['nullable', Rule::enum(PaymentMethod::class)],
        ]);

        $order = $this->sales->cancel($sale, $request->user(), $data['reason'], $data['refund_method'] ?? null);

        return $this->ok(new SalesOrderResource($order->load(['items', 'payments', 'opener'])));
    }

    /** @return Builder<Order> */
    private function ledger(Restaurant $restaurant)
    {
        return BranchScope::apply(Order::query()->where('restaurant_id', $restaurant->id));
    }

    private function idempotencyKey(Request $request): string
    {
        $key = (string) $request->header('Idempotency-Key', '');
        if (Validator::make(['key' => $key], ['key' => ['required', 'uuid']])->fails()) {
            throw ApiException::invalid('الترويسة Idempotency-Key (UUID) مطلوبة', 'IDEMPOTENCY_KEY_REQUIRED');
        }

        return strtolower($key);
    }
}
