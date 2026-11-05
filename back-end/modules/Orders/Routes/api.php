<?php

use Illuminate\Support\Facades\Route;
use Modules\Orders\Http\Controllers\OrderController;
use Modules\Orders\Http\Controllers\PublicOrderController;

Route::middleware('throttle:public')->prefix('public')->group(function () {
    Route::post('menus/{slug}/orders', [PublicOrderController::class, 'store']);
    Route::post('menus/{slug}/complaints', [PublicOrderController::class, 'complain']);
});

Route::middleware(['auth:sanctum', 'active', 'operator'])->prefix('admin')->group(function () {
    Route::get('order-complaints', [OrderController::class, 'complaints']);
});

Route::middleware(['auth:sanctum', 'active', 'tenant', 'tenant.active'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        Route::get('orders', [OrderController::class, 'index'])->middleware('permission:orders.view');
        Route::get('complaints', [OrderController::class, 'restaurantComplaints'])->middleware('permission:orders.view');
        Route::get('orders/{order}', [OrderController::class, 'show'])->middleware('permission:orders.view');
        Route::post('orders/{order}/confirm', [OrderController::class, 'confirm'])->middleware('permission:orders.manage');
        Route::post('orders/{order}/reject', [OrderController::class, 'reject'])->middleware('permission:orders.manage');
    });
