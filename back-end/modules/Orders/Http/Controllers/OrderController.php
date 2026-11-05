<?php

namespace Modules\Orders\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Orders\Http\Resources\OrderResource;
use Modules\Orders\Models\MenuComplaint;
use Modules\Orders\Models\Order;
use Modules\Orders\Services\OrderService;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Support\MallAccess;

class OrderController extends ApiController
{
    public function __construct(private readonly OrderService $orders) {}

    public function index(Request $request, Restaurant $restaurant)
    {
        $request->validate([
            'status' => ['nullable', Rule::enum(OrderStatus::class)],
        ]);

        $orders = Order::query()
            ->where('restaurant_id', $restaurant->id)
            ->where('status', $request->query('status', OrderStatus::Pending->value))
            ->latest()
            ->with('items')
            ->paginate($this->perPage(30));

        return OrderResource::collection($orders);
    }

    public function restaurantComplaints(Restaurant $restaurant): JsonResponse
    {
        $rows = MenuComplaint::query()
            ->where('restaurant_id', $restaurant->id)
            ->latest()
            ->limit(50)
            ->get();

        return $this->ok($rows->map(fn (MenuComplaint $row) => [
            'id' => $row->id,
            'product_name' => $row->product_name,
            'description' => $row->description,
            'created_at' => $row->created_at?->toIso8601String(),
        ])->values());
    }

    /** Recent product complaints for the signed-in mall manager, or every store for a platform admin. */
    public function complaints(Request $request): JsonResponse
    {
        $rows = MenuComplaint::query()
            ->whereHas('restaurant', fn ($query) => MallAccess::scopeRestaurants($query, $request->user()))
            ->with('restaurant:id,name,slug')
            ->latest()
            ->limit(40)
            ->get();

        return $this->ok($rows->map(fn (MenuComplaint $row) => [
            'id' => $row->id,
            'product_name' => $row->product_name,
            'description' => $row->description,
            'created_at' => $row->created_at?->toIso8601String(),
            'restaurant' => [
                'id' => $row->restaurant?->id,
                'name' => $row->restaurant?->name,
                'slug' => $row->restaurant?->slug,
            ],
        ])->values());
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
