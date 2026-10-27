<?php

namespace Modules\Shared\Enums;

enum RestaurantStatus: string
{
    case Trial = 'TRIAL';
    case Active = 'ACTIVE';
    case Suspended = 'SUSPENDED';
    case Expired = 'EXPIRED';
    case Cancelled = 'CANCELLED';

    /** Restaurants in these states can be edited by their staff and shown publicly. */
    public function isOperational(): bool
    {
        return $this === self::Trial || $this === self::Active;
    }
}
