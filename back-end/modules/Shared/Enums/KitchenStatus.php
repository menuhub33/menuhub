<?php

namespace Modules\Shared\Enums;

/**
 * Preparation status of a confirmed order, shown on the kitchen screen.
 *
 * NEW -> PREPARING -> READY -> SERVED. It is independent from `OrderStatus`
 * (the order must be CONFIRMED to appear in the kitchen at all).
 */
enum KitchenStatus: string
{
    case New = 'NEW';
    case Preparing = 'PREPARING';
    case Ready = 'READY';
    case Served = 'SERVED';

    /** Statuses the kitchen screen still shows. */
    public const ACTIVE = [self::New, self::Preparing, self::Ready];

    public function next(): ?self
    {
        return match ($this) {
            self::New => self::Preparing,
            self::Preparing => self::Ready,
            self::Ready => self::Served,
            self::Served => null,
        };
    }

    public function previous(): ?self
    {
        return match ($this) {
            self::New => null,
            self::Preparing => self::New,
            self::Ready => self::Preparing,
            self::Served => self::Ready,
        };
    }

    /** One step forward or back (or no change) is allowed; jumping is not. */
    public function canMoveTo(self $target): bool
    {
        return $target === $this || $target === $this->next() || $target === $this->previous();
    }

    /** @return list<string> */
    public static function activeValues(): array
    {
        return array_map(fn (self $status) => $status->value, self::ACTIVE);
    }
}
