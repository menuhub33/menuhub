<?php

namespace Modules\Theming\Providers;

use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;
use Modules\Theming\Models\RestaurantTheme;

class ThemingServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Restaurant::resolveRelationUsing('theme', fn (Restaurant $r) => $r->hasOne(RestaurantTheme::class));
    }
}
