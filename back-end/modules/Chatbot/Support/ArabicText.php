<?php

namespace Modules\Chatbot\Support;

/**
 * Arabic-aware text normalisation and tokenisation used by the rule based
 * answerer (port of the helpers in lib/menu-chat.ts).
 */
final class ArabicText
{
    private const STOPWORDS = [
        'في', 'من', 'على', 'هل', 'ما', 'شو', 'كم', 'سعر', 'سعره', 'سعرها', 'اسعار', 'اريد', 'بدي',
        'عندكم', 'عندك', 'يا', 'ال', 'و', 'او', 'هذا', 'هذه', 'هيدا', 'عن', 'لي', 'لو', 'سمحت',
        'ممكن', 'فيه', 'فيكم', 'عند', 'شي', 'شيء', 'please', 'the', 'a', 'an', 'is', 'do', 'you', 'have',
    ];

    private const SYNONYMS = [
        'بيتزا' => ['pizza'],
        'برغر' => ['برجر', 'همبرغر', 'burger'],
        'برجر' => ['برغر', 'burger'],
        'دجاج' => ['فروج', 'تشكن', 'chicken'],
        'فروج' => ['دجاج', 'chicken'],
        'لحم' => ['لحمه', 'كباب', 'مشاوي'],
        'مشروب' => ['مشروبات', 'عصير', 'drink', 'كولا'],
        'مشروبات' => ['مشروب', 'عصير'],
        'قهوه' => ['كوفي', 'coffee', 'اسبريسو', 'لاتيه'],
        'كوفي' => ['قهوه', 'coffee'],
        'حلو' => ['حلويات', 'dessert', 'كيك'],
        'حلويات' => ['حلو', 'كيك'],
        'ساندويش' => ['ساندويتش', 'شطيره'],
        'ساندويتش' => ['ساندويش'],
        'بطاطا' => ['فريز', 'fries'],
        'سلطه' => ['سلطة', 'salad'],
        'سياره' => ['سيارة', 'سيارات', 'car', 'cars'],
        'سيارة' => ['سياره', 'سيارات', 'car'],
        'سيارات' => ['سياره', 'سيارة', 'car'],
        'سيدان' => ['sedan'],
        'كهربائيه' => ['كهربائية', 'electric', 'تسلا', 'tesla'],
        'كهربائية' => ['كهربائيه', 'electric'],
        'تويوتا' => ['toyota'],
        'هيونداي' => ['hyundai'],
        'كيا' => ['kia'],
        'سنتافيه' => ['سانتافي', 'santa fe', 'santafe'],
        'سانتافي' => ['سنتافيه', 'santa fe'],
        'سبورتاج' => ['sportage'],
        'برادو' => ['prado'],
        'سورنتو' => ['سيرنتو', 'sorento'],
        'سيرنتو' => ['سورنتو', 'sorento'],
        'توسان' => ['tucson'],
        'فورتشنر' => ['fortuner'],
        'باجيرو' => ['pajero'],
        'إلنترا' => ['النترا', 'elantra'],
        'كورولا' => ['corolla'],
        'سيراتو' => ['cerato', 'forte'],
        'ريو' => ['rio', 'تكسي', 'تكاسي'],
        'تكسي' => ['تكاسي', 'rio', 'ريو'],
        'تكاسي' => ['تكسي', 'ريو', 'rio'],
        'بي ام' => ['bmw', 'بي ام دبليو'],
        'بي ام دبليو' => ['bmw', 'بي ام'],
        'اودي' => ['audi', 'أودي'],
        'أودي' => ['audi', 'اودي'],
        'لانسر' => ['lancer'],
        'ميتسوبيشي' => ['mitsubishi', 'مستوبيشي', 'مستابيشي'],
        'مستابيشي' => ['ميتسوبيشي', 'mitsubishi'],
    ];

    public static function normalize(?string $value): string
    {
        $text = mb_strtolower((string) $value);
        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}]/u', '', $text) ?? '';
        $text = preg_replace('/[أإآٱ]/u', 'ا', $text) ?? '';
        $text = str_replace(['ة', 'ى', 'ؤ', 'ئ'], ['ه', 'ي', 'و', 'ي'], $text);
        $text = preg_replace('/[^\p{L}\p{N}\s]/u', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/u', ' ', $text) ?? '');
    }

    /** @return list<string> */
    public static function tokens(string $value): array
    {
        $base = array_values(array_filter(
            explode(' ', self::normalize($value)),
            fn (string $token) => mb_strlen($token) >= 2 && ! in_array($token, self::STOPWORDS, true),
        ));

        $extra = [];
        foreach ($base as $token) {
            foreach (self::SYNONYMS[$token] ?? [] as $synonym) {
                $extra[] = self::normalize($synonym);
            }
        }

        return array_values(array_unique([...$base, ...$extra]));
    }

    public static function looksLike(string $query, string $pattern): bool
    {
        return (bool) preg_match($pattern.'u', self::normalize($query));
    }
}
