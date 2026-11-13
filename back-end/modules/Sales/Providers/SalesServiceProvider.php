<?php

namespace Modules\Sales\Providers;

use Illuminate\Routing\Route as RouteInstance;
use Illuminate\Support\Facades\Route;
use Modules\Orders\Models\Order;
use Modules\Sales\Models\OrderPayment;
use Modules\Sales\Services\PaymentService;
use Modules\Sales\Services\SalesOrderService;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;

class SalesServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PaymentService::class);
        $this->app->singleton(SalesOrderService::class);
    }

    protected function bootModule(): void
    {
        Order::resolveRelationUsing('payments', fn (Order $order) => $order->hasMany(OrderPayment::class)
            ->orderBy('created_at')
            ->orderBy('id'));
        Order::resolveRelationUsing('opener', fn (Order $order) => $order->belongsTo(User::class, 'opened_by'));

        // `{sale}` is an order of the restaurant in the URL (the `{order}` binding of the Orders module
        // is only registered there, and keeps its own behaviour untouched).
        Route::bind('sale', function (string $value, RouteInstance $route) {
            $restaurant = $route->parameter('restaurant');
            $restaurantId = $restaurant instanceof Restaurant ? $restaurant->id : (string) $restaurant;

            return Order::query()->where('restaurant_id', $restaurantId)->findOrFail($value);
        });
    }
}
