<?php

namespace Modules\Shared\Enums;

enum ProductSeason: string
{
    case Winter = 'WINTER';
    case Spring = 'SPRING';
    case Summer = 'SUMMER';
    case Autumn = 'AUTUMN';

    public function label(): string
    {
        return match ($this) {
            self::Winter => 'شتاء',
            self::Spring => 'ربيع',
            self::Summer => 'صيف',
            self::Autumn => 'خريف',
        };
    }

    /** Meteorological season for Damascus (Dec–Feb, Mar–May, Jun–Aug, Sep–Nov). */
    public static function current(): self
    {
        $month = (int) now('Asia/Damascus')->month;

        return match (true) {
            $month === 12, $month <= 2 => self::Winter,
            $month <= 5 => self::Spring,
            $month <= 8 => self::Summer,
            default => self::Autumn,
        };
    }
}
