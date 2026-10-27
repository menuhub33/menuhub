<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\UploadController;

Route::middleware(['auth:sanctum', 'active', 'throttle:uploads'])->prefix('uploads')->group(function () {
    Route::post('/', [UploadController::class, 'store']);
    Route::delete('/', [UploadController::class, 'destroy']);
});
