<?php

namespace Modules\Inventory\Providers;

use Modules\Inventory\Services\InventoryService;
use Modules\Shared\Support\ModuleServiceProvider;

class InventoryServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(InventoryService::class);
    }
}
