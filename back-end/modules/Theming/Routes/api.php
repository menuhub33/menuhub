<?php

use Illuminate\Support\Facades\Route;
use Modules\Theming\Http\Controllers\RestaurantThemeController;
use Modules\Theming\Http\Controllers\ThemeController;

Route::get('themes', [ThemeController::class, 'index'])->middleware('throttle:public');

Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('themes', [ThemeController::class, 'adminIndex']);
    Route::post('themes', [ThemeController::class, 'store']);
    Route::patch('themes/{theme}', [ThemeController::class, 'update']);
    Route::delete('themes/{theme}', [ThemeController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'active', 'tenant', 'tenant.active'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        Route::get('theme', [RestaurantThemeController::class, 'show'])->middleware('permission:restaurant.view');
        Route::put('theme', [RestaurantThemeController::class, 'update'])->middleware('permission:design.update');
        Route::patch('theme', [RestaurantThemeController::class, 'update'])->middleware('permission:design.update');
    });
