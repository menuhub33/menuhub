<?php

namespace Modules\Platform\Providers;

use Modules\Platform\Console\SeedDemoCommand;
use Modules\Platform\Services\PosPricing;
use Modules\Shared\Contracts\PricesPosPackage;
use Modules\Shared\Support\ModuleServiceProvider;

class PlatformServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PricesPosPackage::class, PosPricing::class);
    }

    protected function bootModule(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([SeedDemoCommand::class]);
        }
    }
}
