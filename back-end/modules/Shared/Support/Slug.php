<?php

namespace Modules\Shared\Support;

use Illuminate\Support\Str;

class Slug
{
    public const PATTERN = '/^[a-z0-9]+(?:-[a-z0-9]+)*$/';

    public static function isValid(string $slug): bool
    {
        return (bool) preg_match(self::PATTERN, $slug) && strlen($slug) <= 100;
    }

    /** Latin-only slug; Arabic names fall back to a random `menu-xxxxxx`. */
    public static function fromName(string $name): string
    {
        $latin = Str::of($name)->trim()->lower()
            ->replaceMatches('/[^a-z0-9]+/', '-')
            ->trim('-')
            ->limit(40, '')
            ->toString();

        return strlen($latin) >= 3 ? $latin : 'menu-'.Str::lower(Str::random(6));
    }
}
