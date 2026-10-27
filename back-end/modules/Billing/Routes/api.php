<?php

use Illuminate\Support\Facades\Route;
use Modules\Billing\Http\Controllers\AdminBillingController;
use Modules\Billing\Http\Controllers\PlanController;
use Modules\Billing\Http\Controllers\RestaurantBillingController;

Route::get('plans', [PlanController::class, 'index'])->middleware('throttle:public');

// Restaurant owners: read-only.
Route::middleware(['auth:sanctum', 'active', 'tenant'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        Route::get('subscription', [RestaurantBillingController::class, 'subscription'])->middleware('permission:settings.view');
        Route::get('invoices', [RestaurantBillingController::class, 'invoices'])->middleware('permission:subscription.manage');
        Route::get('payments', [RestaurantBillingController::class, 'payments'])->middleware('permission:subscription.manage');
    });

// Platform administration.
Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('plans', [PlanController::class, 'adminIndex']);
    Route::post('plans', [PlanController::class, 'store']);
    Route::patch('plans/{plan}', [PlanController::class, 'update']);
    Route::delete('plans/{plan}', [PlanController::class, 'destroy']);

    Route::get('subscriptions', [AdminBillingController::class, 'subscriptions']);
    Route::patch('subscriptions/{subscription}', [AdminBillingController::class, 'updateSubscription']);
    Route::put('restaurants/{restaurant}/plan', [AdminBillingController::class, 'assignPlan']);

    Route::get('invoices', [AdminBillingController::class, 'invoices']);
    Route::post('invoices', [AdminBillingController::class, 'storeInvoice']);
    Route::patch('invoices/{invoice}', [AdminBillingController::class, 'updateInvoice']);

    Route::get('payments', [AdminBillingController::class, 'payments']);
    Route::post('payments', [AdminBillingController::class, 'storePayment']);
    Route::patch('payments/{payment}', [AdminBillingController::class, 'updatePayment']);
});
