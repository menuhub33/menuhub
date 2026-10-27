<?php

namespace Modules\Platform\Providers;

use Modules\Platform\Console\SeedDemoCommand;
use Modules\Shared\Support\ModuleServiceProvider;

class PlatformServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([SeedDemoCommand::class]);
        }
    }
}
