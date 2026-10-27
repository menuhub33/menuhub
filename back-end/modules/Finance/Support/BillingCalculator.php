<?php

namespace Modules\Finance\Support;

use Carbon\CarbonImmutable;
use Modules\Shared\Enums\DiscountType;

/**
 * Pure money maths for menu contracts (port of lib/menu-billing.ts).
 */
final class BillingCalculator
{
    public const MAX_INSTALLMENTS = 24;

    public static function round(float $value): float
    {
        return round($value + PHP_FLOAT_EPSILON, 2);
    }

    public static function net(float $price, DiscountType $type, float $discountValue): float
    {
        return match ($type) {
            DiscountType::Percent => self::round($price * (1 - min(100.0, max(0.0, $discountValue)) / 100)),
            DiscountType::Amount => self::round(max(0.0, $price - $discountValue)),
            DiscountType::None => self::round($price),
        };
    }

    public static function profit(float $price, DiscountType $type, float $discountValue, float $setupCost): float
    {
        return self::round(self::net($price, $type, $discountValue) - $setupCost);
    }

    /**
     * Splits the net price into equal installments; the last one takes the remainder.
     *
     * @return list<float>
     */
    public static function installmentAmounts(float $net, int $count): array
    {
        $count = min(self::MAX_INSTALLMENTS, max(1, $count));

        if ($count === 1) {
            return [self::round($net)];
        }

        $base = floor(($net / $count) * 100) / 100;
        $amounts = array_fill(0, $count, $base);
        $assigned = self::round($base * ($count - 1));
        $amounts[$count - 1] = self::round(max(0.0, $net - $assigned));

        return $amounts;
    }

    /** Calendar month addition with overflow, like JS `Date.UTC` (Jan 31 + 1 = Mar 3). */
    public static function addMonths(string $isoDate, int $months): string
    {
        return CarbonImmutable::parse($isoDate)->startOfDay()->addMonthsWithOverflow($months)->toDateString();
    }
}
