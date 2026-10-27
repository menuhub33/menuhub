<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Registers every enabled module (see config/modules.php).
 *
 * A module is a self-contained folder under /modules with its own service
 * provider, migrations, routes, models, services and tests.
 */
class ModuleServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        foreach ($this->enabled() as $name) {
            $provider = "Modules\\{$name}\\Providers\\{$name}ServiceProvider";

            if (class_exists($provider)) {
                $this->app->register($provider);
            }
        }
    }

    /** @return list<string> */
    public function enabled(): array
    {
        return config('modules.enabled', []);
    }
}
