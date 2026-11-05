<?php

namespace Modules\Orders\Providers;

use Illuminate\Routing\Route as RouteInstance;
use Illuminate\Support\Facades\Route;
use Modules\Orders\Models\Order;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;

class OrdersServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Route::bind('order', function (string $value, RouteInstance $route) {
            $restaurant = $route->parameter('restaurant');
            $restaurantId = $restaurant instanceof Restaurant ? $restaurant->id : (string) $restaurant;

            return Order::query()->where('restaurant_id', $restaurantId)->findOrFail($value);
        });
    }
}
