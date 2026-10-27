<?php

use Illuminate\Support\Facades\Route;
use Modules\Media\Http\Controllers\MediaFileController;
use Modules\Media\Http\Controllers\UploadController;

Route::get('media/{path}', [MediaFileController::class, 'show'])
    ->where('path', '.*')
    ->middleware('throttle:public');

Route::middleware(['auth:sanctum', 'active', 'throttle:uploads'])->prefix('uploads')->group(function () {
    Route::post('/', [UploadController::class, 'store']);
    Route::delete('/', [UploadController::class, 'destroy']);
});
