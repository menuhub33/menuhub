<?php

use Illuminate\Support\Facades\Route;
use Modules\Tenancy\Http\Controllers\RestaurantController;
use Modules\Tenancy\Http\Controllers\StaffController;

Route::get('slugs/check', [RestaurantController::class, 'checkSlug'])->middleware('throttle:public');

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
