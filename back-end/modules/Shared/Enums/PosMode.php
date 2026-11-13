<?php

namespace Modules\Shared\Enums;

/**
 * Optional point-of-sale package of a restaurant, set by a platform admin
 * (it is part of the restaurant definition, not of the subscription plan).
 */
enum PosMode: string
{
    /** No POS: the sales endpoints answer 403 POS_NOT_ENABLED. */
    case Off = 'OFF';

    /** Cashier till only (POS, external/phone orders, collections, receipts, reports). */
    case Cashier = 'CASHIER';

    /** Cashier till plus the waiter screen (orders sent without payment, collected later). */
    case CashierWaiter = 'CASHIER_WAITER';

    public function enabled(): bool
    {
        return $this !== self::Off;
    }

    public function waiterEnabled(): bool
    {
        return $this === self::CashierWaiter;
    }

    public static function normalize(?string $value): self
    {
        return self::tryFrom(strtoupper((string) $value)) ?? self::Off;
    }
}
