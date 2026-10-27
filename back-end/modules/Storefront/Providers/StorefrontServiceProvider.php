<?php

namespace Modules\Storefront\Providers;

use Illuminate\Support\Facades\Event;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Storefront\Listeners\InvalidateStorefrontCache;

class StorefrontServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Event::listen(RestaurantContentChanged::class, InvalidateStorefrontCache::class);
    }
}
