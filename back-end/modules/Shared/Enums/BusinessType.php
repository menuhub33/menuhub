<?php

namespace Modules\Shared\Enums;

enum BusinessType: string
{
    case Restaurant = 'RESTAURANT';
    case Cafe = 'CAFE';
    case Shop = 'SHOP';

    public static function normalize(?string $value): self
    {
        return self::tryFrom(strtoupper((string) $value)) ?? self::Restaurant;
    }
}
