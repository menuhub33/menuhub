<?php

use Illuminate\Support\Facades\Route;
use Modules\Operations\Http\Controllers\BranchController;
use Modules\Operations\Http\Controllers\BusinessHourController;
use Modules\Operations\Http\Controllers\CustomDomainController;
use Modules\Operations\Http\Controllers\QrCodeController;
use Modules\Operations\Http\Controllers\SocialLinkController;

Route::middleware(['auth:sanctum', 'active', 'tenant', 'tenant.active'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        // Business hours & social links: part of the restaurant profile.
        Route::get('business-hours', [BusinessHourController::class, 'index'])->middleware('permission:restaurant.view');
        Route::put('business-hours', [BusinessHourController::class, 'sync'])->middleware('permission:restaurant.update');

        Route::get('social-links', [SocialLinkController::class, 'index'])->middleware('permission:restaurant.view');
        Route::middleware('permission:restaurant.update')->group(function () {
            Route::post('social-links', [SocialLinkController::class, 'store']);
            Route::post('social-links/reorder', [SocialLinkController::class, 'reorder']);
            Route::patch('social-links/{link}', [SocialLinkController::class, 'update']);
            Route::patch('social-links/{link}/status', [SocialLinkController::class, 'setStatus']);
            Route::delete('social-links/{link}', [SocialLinkController::class, 'destroy']);
        });

        // QR codes
        Route::get('qr-codes', [QrCodeController::class, 'index'])->middleware('permission:restaurant.view');
        Route::middleware('permission:qr.manage')->group(function () {
            Route::post('qr-codes', [QrCodeController::class, 'store']);
            Route::patch('qr-codes/{qr}', [QrCodeController::class, 'update']);
            Route::delete('qr-codes/{qr}', [QrCodeController::class, 'destroy']);
        });

        // Branches
        Route::get('branches', [BranchController::class, 'index'])->middleware('permission:restaurant.view');
        Route::middleware('permission:branches.manage')->group(function () {
            Route::post('branches', [BranchController::class, 'store']);
            Route::patch('branches/{branch}', [BranchController::class, 'update']);
            Route::patch('branches/{branch}/status', [BranchController::class, 'setStatus']);
            Route::delete('branches/{branch}', [BranchController::class, 'destroy']);
        });

        // Custom domains
        Route::get('custom-domains', [CustomDomainController::class, 'index'])->middleware('permission:domains.manage');
        Route::middleware('permission:domains.manage')->group(function () {
            Route::post('custom-domains', [CustomDomainController::class, 'store']);
            Route::post('custom-domains/{domain}/verify', [CustomDomainController::class, 'verify']);
            Route::delete('custom-domains/{domain}', [CustomDomainController::class, 'destroy']);
        });
    });
