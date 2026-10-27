<?php

namespace Modules\Storefront\Listeners;

use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Storefront\Services\PublicMenuService;

class InvalidateStorefrontCache
{
    public function __construct(private readonly PublicMenuService $menus) {}

    public function handle(RestaurantContentChanged $event): void
    {
        $this->menus->bump($event->restaurantId);
    }
}
