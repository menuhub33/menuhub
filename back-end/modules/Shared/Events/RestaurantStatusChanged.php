<?php

namespace Modules\Shared\Events;

use Illuminate\Foundation\Events\Dispatchable;

/**
 * An administrator changed the lifecycle status of a restaurant.
 */
class RestaurantStatusChanged
{
    use Dispatchable;

    public function __construct(
        public readonly string $restaurantId,
        public readonly string $restaurantName,
        public readonly string $from,
        public readonly string $to,
    ) {}
}
