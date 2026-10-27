<?php

namespace Modules\Shared\Support;

/**
 * Port of the front-end `phone.ts` / `social.ts` helpers.
 */
final class PhoneNumber
{
    public static function digits(?string $value): string
    {
        return preg_replace('/\D/', '', (string) $value) ?? '';
    }

    /** International digits for wa.me (Syrian 09xxxxxxxx -> 9639xxxxxxxx). */
    public static function toWhatsApp(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        if (preg_match('#^https?://#i', $value)) {
            return preg_match('/(\d{8,})/', $value, $match) ? self::normalize($match[1]) : null;
        }

        $digits = self::digits($value);

        return strlen($digits) < 8 ? null : self::normalize($digits);
    }

    public static function whatsAppLink(?string $value): ?string
    {
        $number = self::toWhatsApp($value);

        return $number ? "https://wa.me/{$number}" : null;
    }

    /** Link (or null when the input is not usable) for a social platform. */
    public static function socialUrl(string $platform, string $value): ?string
    {
        $value = trim($value);
        if ($value === '') {
            return null;
        }

        if ($platform === 'whatsapp') {
            return self::whatsAppLink($value);
        }

        if (preg_match('#^https?://#i', $value)) {
            return $value;
        }

        return 'https://'.ltrim($value, '/');
    }

    private static function normalize(string $digits): string
    {
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }
        if (preg_match('/^09\d{8}$/', $digits)) {
            return '963'.substr($digits, 1);
        }
        if (preg_match('/^9\d{8}$/', $digits)) {
            return '963'.$digits;
        }

        return $digits;
    }
}
