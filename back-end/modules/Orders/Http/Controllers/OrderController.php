<?php

namespace Modules\Orders\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Orders\Http\Resources\OrderResource;
use Modules\Orders\Models\Order;
use Modules\Orders\Services\OrderService;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class OrderController extends ApiController
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request, Restaurant $restaurant)
    {
        $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
        ]);

        $status = $request->query('status', OrderStatus::Pending->value);

        $orders = Order::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('status', $status)
            ->with('items')
            ->latest()
            ->paginate($this->perPage(30));

        return OrderResource::collection($orders);
    }

    public function show(Restaurant $restaurant, Order $order): JsonResponse
    {
        return $this->ok(new OrderResource($order->load('items')));
    }

    public function confirm(Restaurant $restaurant, Order $order): JsonResponse
    {
        return $this->ok(new OrderResource($this->orders->confirm($order)));
    }

    public function reject(Restaurant $restaurant, Order $order): JsonResponse
    {
        return $this->ok(new OrderResource($this->orders->reject($order)));
    }
}
