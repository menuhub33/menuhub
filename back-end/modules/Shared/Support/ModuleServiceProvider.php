<?php

namespace Modules\Shared\Support;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Base class for every module provider.
 *
 * Convention-over-configuration: a module only has to follow the folder
 * layout below and it is wired automatically.
 *
 *   modules/{Name}/
 *     Database/Migrations   -> loaded as migrations
 *     Routes/api.php        -> mounted under /api/v1 with the "api" middleware
 *     Providers/{Name}ServiceProvider.php (extends this class)
 */
abstract class ModuleServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $path = $this->modulePath();

        if (is_dir($path.'/Database/Migrations')) {
            $this->loadMigrationsFrom($path.'/Database/Migrations');
        }

        if (is_file($path.'/Routes/api.php')) {
            Route::middleware('api')
                ->prefix('api/v1')
                ->group($path.'/Routes/api.php');
        }

        $this->bootModule();
    }

    public function moduleName(): string
    {
        $segments = explode('\\', static::class);

        return $segments[1];
    }

    public function modulePath(string $suffix = ''): string
    {
        return base_path('modules/'.$this->moduleName()).($suffix ? '/'.ltrim($suffix, '/') : '');
    }

    /** Module specific boot logic (listeners, policies, route bindings...). */
    protected function bootModule(): void
    {
        //
    }
}
