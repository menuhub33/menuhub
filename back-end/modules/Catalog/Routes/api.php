<?php

use Illuminate\Support\Facades\Route;
use Modules\Catalog\Http\Controllers\CatalogController;
use Modules\Catalog\Http\Controllers\CategoryController;
use Modules\Catalog\Http\Controllers\MenuController;
use Modules\Catalog\Http\Controllers\OptionController;
use Modules\Catalog\Http\Controllers\ProductController;
use Modules\Catalog\Http\Controllers\ProductImageController;

Route::middleware(['auth:sanctum', 'active', 'tenant', 'tenant.active'])
    ->prefix('restaurants/{restaurant}')
    ->group(function () {
        Route::get('catalog', [CatalogController::class, 'index'])->middleware('permission:menu.view');

        // Menus
        Route::get('menus', [MenuController::class, 'index'])->middleware('permission:menu.view');
        Route::get('menus/{menu}', [MenuController::class, 'show'])->middleware('permission:menu.view');
        Route::middleware('permission:menu.publish')->group(function () {
            Route::post('menus', [MenuController::class, 'store']);
            Route::patch('menus/{menu}', [MenuController::class, 'update']);
            Route::post('menus/{menu}/publish', [MenuController::class, 'publish']);
            Route::post('menus/{menu}/unpublish', [MenuController::class, 'unpublish']);
            Route::delete('menus/{menu}', [MenuController::class, 'destroy']);
        });

        // Categories
        Route::get('categories', [CategoryController::class, 'index'])->middleware('permission:categories.view');
        Route::post('categories', [CategoryController::class, 'store'])->middleware('permission:categories.create');
        Route::post('categories/reorder', [CategoryController::class, 'reorder'])->middleware('permission:categories.update');
        Route::get('categories/{category}', [CategoryController::class, 'show'])->middleware('permission:categories.view');
        Route::patch('categories/{category}', [CategoryController::class, 'update'])->middleware('permission:categories.update');
        Route::patch('categories/{category}/status', [CategoryController::class, 'setStatus'])->middleware('permission:categories.update');
        Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->middleware('permission:categories.delete');

        // Products
        Route::get('products', [ProductController::class, 'index'])->middleware('permission:products.view');
        Route::post('products', [ProductController::class, 'store'])->middleware('permission:products.create');
        Route::post('products/reorder', [ProductController::class, 'reorder'])->middleware('permission:products.update');
        Route::get('products/{product}', [ProductController::class, 'show'])->middleware('permission:products.view');
        Route::patch('products/{product}', [ProductController::class, 'update'])->middleware('permission:products.update');
        Route::patch('products/{product}/status', [ProductController::class, 'setStatus'])->middleware('permission:products.availability');
        Route::post('products/{product}/duplicate', [ProductController::class, 'duplicate'])->middleware('permission:products.create');
        Route::delete('products/{product}', [ProductController::class, 'destroy'])->middleware('permission:products.delete');

        // Product gallery
        Route::post('products/{product}/images', [ProductImageController::class, 'store'])->middleware('permission:products.update');
        Route::patch('product-images/{image}', [ProductImageController::class, 'update'])->middleware('permission:products.update');
        Route::delete('product-images/{image}', [ProductImageController::class, 'destroy'])->middleware('permission:products.update');

        // Option groups and options
        Route::get('products/{product}/option-groups', [OptionController::class, 'index'])->middleware('permission:products.view');
        Route::middleware('permission:options.manage')->group(function () {
            Route::post('products/{product}/option-groups', [OptionController::class, 'storeGroup']);
            Route::patch('option-groups/{group}', [OptionController::class, 'updateGroup']);
            Route::delete('option-groups/{group}', [OptionController::class, 'destroyGroup']);
            Route::post('option-groups/{group}/options', [OptionController::class, 'storeOption']);
            Route::patch('options/{option}', [OptionController::class, 'updateOption']);
            Route::delete('options/{option}', [OptionController::class, 'destroyOption']);
        });
    });
