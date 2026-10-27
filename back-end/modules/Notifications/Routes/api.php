<?php

use Illuminate\Support\Facades\Route;
use Modules\Notifications\Http\Controllers\NotificationController;

Route::middleware(['auth:sanctum', 'active'])->prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('read-all', [NotificationController::class, 'markAllRead']);
    Route::patch('{notification}/read', [NotificationController::class, 'markRead']);
});
