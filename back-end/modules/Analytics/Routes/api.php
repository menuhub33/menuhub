<?php

use Illuminate\Support\Facades\Route;
use Modules\Analytics\Http\Controllers\AnalyticsController;
use Modules\Analytics\Http\Controllers\PublicEventController;

Route::post('public/menus/{slug}/events', [PublicEventController::class, 'store'])->middleware('throttle:events');

Route::middleware(['auth:sanctum', 'active', 'tenant'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        Route::get('dashboard', [AnalyticsController::class, 'dashboard'])->middleware('permission:restaurant.view');
        Route::get('analytics/summary', [AnalyticsController::class, 'summary'])->middleware('permission:analytics.view');
        Route::get('analytics/events', [AnalyticsController::class, 'events'])->middleware('permission:analytics.view');
    });
