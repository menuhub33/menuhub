<?php

use Illuminate\Support\Facades\Route;
use Modules\Platform\Http\Controllers\AdminRestaurantController;
use Modules\Platform\Http\Controllers\AdminStatsController;
use Modules\Platform\Http\Controllers\PlatformSettingController;
use Modules\Platform\Http\Controllers\PosPricingController;

Route::middleware(['auth:sanctum', 'active', 'operator'])->prefix('admin')->group(function () {
    Route::get('stats', AdminStatsController::class);

    Route::get('restaurants', [AdminRestaurantController::class, 'index']);
    Route::post('restaurants', [AdminRestaurantController::class, 'store']);
    Route::get('restaurants/{restaurant}', [AdminRestaurantController::class, 'show']);
    Route::patch('restaurants/{restaurant}', [AdminRestaurantController::class, 'update']);
    Route::delete('restaurants/{restaurant}', [AdminRestaurantController::class, 'destroy']);
    Route::put('restaurants/{restaurant}/status', [AdminRestaurantController::class, 'setStatus']);
    Route::put('restaurants/{restaurant}/business-type', [AdminRestaurantController::class, 'setBusinessType']);
});

Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('pos-prices', [PosPricingController::class, 'show']);
    Route::put('pos-prices', [PosPricingController::class, 'update']);
    Route::put('restaurants/{restaurant}/pos-mode', [AdminRestaurantController::class, 'setPosMode']);

    Route::post('demo/{slug}', [AdminRestaurantController::class, 'seedDemo']);

    Route::get('settings', [PlatformSettingController::class, 'index']);
    Route::put('settings', [PlatformSettingController::class, 'update']);
});
