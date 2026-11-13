<?php

namespace Modules\Sales\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Modules\Orders\Models\Order;
use Modules\Sales\Http\Resources\KitchenOrderResource;
use Modules\Sales\Support\BranchScope;
use Modules\Shared\Enums\KitchenStatus;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

/**
 * Kitchen screen. Every CONFIRMED order (cashier, waiter, external or a confirmed QR order)
 * lands here automatically and stays until it is marked SERVED or gets cancelled.
 */
class KitchenController extends ApiController
{
    /** Orders still to cook / hand over, oldest first. */
    public function index(Restaurant $restaurant): JsonResponse
    {
        $orders = BranchScope::apply(Order::query()->where('restaurant_id', $restaurant->id))
            ->where('status', OrderStatus::Confirmed->value)
            ->whereIn('kitchen_status', KitchenStatus::activeValues())
            ->with(['items', 'opener'])
            ->orderBy('confirmed_at')
            ->orderBy('id')
            ->limit(200)
            ->get();

        return $this->ok(KitchenOrderResource::collection($orders));
    }

    /** Moves an order one step along NEW -> PREPARING -> READY -> SERVED (or one step back). */
    public function update(Request $request, Restaurant $restaurant, Order $sale): JsonResponse
    {
        BranchScope::assertAccessible($sale);

        $data = $request->validate([
            'kitchen_status' => ['required', Rule::enum(KitchenStatus::class)],
        ]);
        $target = KitchenStatus::from($data['kitchen_status']);

        $order = DB::transaction(function () use ($sale, $target) {
            $locked = Order::query()->whereKey($sale->id)->lockForUpdate()->firstOrFail();

            if ($locked->status !== OrderStatus::Confirmed) {
                throw ApiException::invalid('هذا الطلب غير مثبّت أو تم إلغاؤه', 'INVALID_TRANSITION');
            }
            if (! $locked->kitchen_status->canMoveTo($target)) {
                throw ApiException::invalid('لا يمكن نقل الطلب إلى هذه الحالة مباشرة', 'INVALID_TRANSITION');
            }

            if ($locked->kitchen_status !== $target) {
                $locked->forceFill(['kitchen_status' => $target, 'kitchen_status_at' => now()])->save();
            }

            return $locked;
        });

        return $this->ok(new KitchenOrderResource($order->load(['items', 'opener'])));
    }
}
