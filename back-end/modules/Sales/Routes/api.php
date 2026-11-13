<?php

use Illuminate\Support\Facades\Route;
use Modules\Sales\Http\Controllers\KitchenController;
use Modules\Sales\Http\Controllers\PaymentController;
use Modules\Sales\Http\Controllers\ReportController;
use Modules\Sales\Http\Controllers\SalesOrderController;

/*
| Sales ledger endpoints (POS, waiter, external orders, payments).
| Order of the middleware matters: the kill switch first, then the usual
| tenant stack, then the restaurant's POS package (`pos.enabled`: restaurants.pos_mode), then per-route permissions.
*/
Route::middleware(['sales.enabled', 'auth:sanctum', 'active', 'tenant', 'tenant.active', 'pos.enabled'])
    ->prefix('restaurants/{restaurant}/sales')
    ->group(function () {
        Route::get('catalog', [SalesOrderController::class, 'catalog'])->middleware('permission:pos.use,sales.create_staff');

        Route::post('orders', [SalesOrderController::class, 'store'])->middleware('permission:sales.create,sales.create_staff');
        Route::get('orders', [SalesOrderController::class, 'index'])->middleware('permission:sales.view');
        Route::get('orders/unpaid', [SalesOrderController::class, 'unpaid'])->middleware('permission:sales.collect');
        Route::get('orders/{sale}', [SalesOrderController::class, 'show'])->middleware('permission:sales.view');
        Route::get('orders/{sale}/receipt', [SalesOrderController::class, 'receipt'])->middleware('permission:sales.view');

        Route::post('orders/{sale}/payments', [PaymentController::class, 'collect'])->middleware('permission:sales.collect');
        Route::post('orders/{sale}/refunds', [PaymentController::class, 'refund'])->middleware('permission:sales.refund');
        Route::post('orders/{sale}/cancel', [SalesOrderController::class, 'cancel'])->middleware('permission:sales.cancel');

        Route::get('kitchen/orders', [KitchenController::class, 'index'])->middleware('permission:kitchen.view');
        Route::patch('kitchen/orders/{sale}', [KitchenController::class, 'update'])->middleware('permission:kitchen.manage');

        Route::get('me/collections', [ReportController::class, 'myCollections'])->middleware('permission:reports.own');

        Route::prefix('reports')->middleware('permission:reports.sales')->group(function () {
            Route::get('summary', [ReportController::class, 'summary']);
            Route::get('timeseries', [ReportController::class, 'timeseries']);
            Route::get('channels', [ReportController::class, 'channels']);
            Route::get('order-types', [ReportController::class, 'orderTypes']);
            Route::get('payment-methods', [ReportController::class, 'paymentMethods']);
            Route::get('products', [ReportController::class, 'products']);
            Route::get('categories', [ReportController::class, 'categories']);
            Route::get('staff', [ReportController::class, 'staff']);
            Route::get('branches', [ReportController::class, 'branches']);
        });
    });
