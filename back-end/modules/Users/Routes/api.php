<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Http\Controllers\AdminUserController;

Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users', [AdminUserController::class, 'store']);
    Route::get('users/{user}', [AdminUserController::class, 'show']);
    Route::patch('users/{user}', [AdminUserController::class, 'update']);
    Route::patch('users/{user}/active', [AdminUserController::class, 'setActive']);
    Route::delete('users/{user}', [AdminUserController::class, 'destroy']);
});
