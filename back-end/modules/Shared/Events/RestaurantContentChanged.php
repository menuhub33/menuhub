<?php

namespace Modules\Shared\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired whenever anything shown on the public menu changes so that caches
 * (see Storefront) can be invalidated without coupling modules together.
 */
class RestaurantContentChanged
{
    use Dispatchable;

    public function __construct(public readonly string $restaurantId) {}
}
