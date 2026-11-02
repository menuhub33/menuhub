<?php

use Illuminate\Support\Facades\Route;
use Modules\Tenancy\Http\Controllers\AdminMallController;
use Modules\Tenancy\Http\Controllers\PublicMallController;
use Modules\Tenancy\Http\Controllers\ReservedSubdomainController;
use Modules\Tenancy\Http\Controllers\RestaurantController;
use Modules\Tenancy\Http\Controllers\StaffController;

Route::get('slugs/check', [RestaurantController::class, 'checkSlug'])->middleware('throttle:public');
Route::get('public/malls/{slug}', [PublicMallController::class, 'show'])->middleware('throttle:public');

Route::middleware(['auth:sanctum', 'active', 'operator'])->prefix('admin')->group(function () {
    Route::get('mall', [AdminMallController::class, 'current']);
    Route::patch('mall', [AdminMallController::class, 'updateCurrent']);
});

Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('malls', [AdminMallController::class, 'index']);
    Route::post('malls', [AdminMallController::class, 'store']);
    Route::get('malls/{mall}', [AdminMallController::class, 'show']);
    Route::patch('malls/{mall}', [AdminMallController::class, 'update']);
    Route::delete('malls/{mall}', [AdminMallController::class, 'destroy']);
    Route::post('malls/{mall}/manager', [AdminMallController::class, 'assignManager']);
});

Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('reserved-subdomains', [ReservedSubdomainController::class, 'index']);
    Route::post('reserved-subdomains', [ReservedSubdomainController::class, 'store']);
    Route::patch('reserved-subdomains/{reserved}', [ReservedSubdomainController::class, 'update']);
    Route::delete('reserved-subdomains/{reserved}', [ReservedSubdomainController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::get('me/restaurants', [RestaurantController::class, 'mine']);

    Route::prefix('restaurants/{restaurant}')->middleware('tenant')->group(function () {
        // Readable even before activation so the UI can show the "pending" screen.
        Route::get('/', [RestaurantController::class, 'show'])->middleware('permission:restaurant.view');

        Route::middleware('tenant.active')->group(function () {
            Route::patch('/', [RestaurantController::class, 'update'])->middleware('permission:restaurant.update');

            Route::get('staff', [StaffController::class, 'index'])->middleware('permission:restaurant.view');
            Route::post('staff', [StaffController::class, 'store'])->middleware('permission:staff.manage');
            Route::patch('staff/{membership}', [StaffController::class, 'update'])->middleware('permission:staff.manage');
            Route::delete('staff/{membership}', [StaffController::class, 'destroy'])->middleware('permission:staff.manage');
        });
    });
});
