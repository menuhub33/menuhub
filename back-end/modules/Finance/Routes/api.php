<?php

use Illuminate\Support\Facades\Route;
use Modules\Finance\Http\Controllers\FinanceController;

Route::middleware(['auth:sanctum', 'active', 'admin'])->prefix('admin')->group(function () {
    Route::get('finance', [FinanceController::class, 'index']);
    Route::put('restaurants/{restaurant}/billing', [FinanceController::class, 'save']);
    Route::delete('finance/{billing}', [FinanceController::class, 'destroy']);
    Route::patch('installments/{installment}', [FinanceController::class, 'setPaid']);
});
