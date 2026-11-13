<?php

namespace Modules\Shared\Enums;

/**
 * Fulfillment status of an order. `PENDING` is what the sales spec calls OPEN.
 */
enum OrderStatus: string
{
    case Pending = 'PENDING';
    case Confirmed = 'CONFIRMED';
    case Rejected = 'REJECTED';
    case Cancelled = 'CANCELLED';

    /** Name used by the sales API (spec ADR-01): PENDING is exposed as OPEN. */
    public function fulfillment(): string
    {
        return $this === self::Pending ? 'OPEN' : $this->value;
    }
}
