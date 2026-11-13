<?php

namespace Modules\Shared\Support;

/**
 * Money arithmetic on integer minor units ("cents", 2 decimals).
 *
 * Amounts enter the system once (`cents()`), every calculation after that is
 * integer math, and they leave as `DECIMAL(12,2)` strings (`format()`).
 * This avoids float drift without requiring the bcmath extension.
 */
final class Money
{
    /** Parses "12.5", 12.5, 12 or "12.50" into 1250. */
    public static function cents(mixed $amount): int
    {
        if ($amount === null || $amount === '') {
            return 0;
        }

        return (int) round(((float) $amount) * 100);
    }

    /** 1250 => "12.50" */
    public static function format(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $abs = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($abs, 100), $abs % 100);
    }

    public static function float(int $cents): float
    {
        return $cents / 100;
    }

    /** Percentage of an amount, rounded half-up to the cent. */
    public static function percentOf(int $cents, string|int|float $percent): int
    {
        return (int) round($cents * ((float) $percent) / 100);
    }
}
