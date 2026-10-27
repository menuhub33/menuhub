<?php

use Illuminate\Support\Facades\Route;
use Modules\Audit\Http\Controllers\AuditLogController;

Route::middleware(['auth:sanctum', 'active', 'tenant'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit.view');
    });
