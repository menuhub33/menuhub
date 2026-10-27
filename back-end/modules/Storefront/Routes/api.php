<?php

use Illuminate\Support\Facades\Route;
use Modules\Storefront\Http\Controllers\StorefrontController;

Route::middleware('throttle:public')->prefix('public')->group(function () {
    Route::get('menus/{slug}', [StorefrontController::class, 'show']);
    Route::get('resolve-host', [StorefrontController::class, 'resolveHost']);
});
