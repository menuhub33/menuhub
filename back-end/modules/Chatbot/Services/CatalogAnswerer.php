<?php

namespace Modules\Chatbot\Services;

use Modules\Chatbot\Support\ArabicText as T;
use Modules\Shared\Support\PhoneNumber;

/**
 * Deterministic, rule based answers from the menu catalog. This is both the
 * offline fallback and the source of the product cards attached to replies.
 * Port of `answerFromCatalog` in lib/menu-chat.ts.
 *
 * Catalog shape: see {@see CatalogBuilder::build()}.
 */
class CatalogAnswerer
{
    public const SUGGESTIONS = ['ما هي الأقسام؟', 'أرخص الأصناف', 'هل التوصيل متاح؟', 'كيف أطلب؟'];

    private const CURRENCY_LABELS = ['SYP' => 'ل.س', 'USD' => 'دولار', 'EUR' => 'يورو', 'SAR' => 'ر.س', 'AED' => 'د.إ', 'TRY' => '₺'];

    /** @param  array<string, mixed>  $catalog */
    public function answer(array $catalog, string $question, ?string $previousUserQuestion = null): array
    {
        $q = trim($question);

        if ($q === '') {
            return ['reply' => $catalog['welcome'], 'products' => [], 'suggestions' => self::SUGGESTIONS];
        }

        $effective = $this->isFollowUp($q) && $previousUserQuestion ? $previousUserQuestion : $q;
        $copy = $this->orderCopy($catalog['businessType']);

        if (T::looksLike($q, '/^(مرحبا|اهلا|السلام|هلا|hi|hello|hey|سلام)/')) {
            return ['reply' => $catalog['welcome'], 'products' => $this->featured($catalog, 3), 'suggestions' => self::SUGGESTIONS];
        }

        if (T::looksLike($q, '/^(شكرا|تسلم|يعطيك العافيه|thanks)/')) {
            return ['reply' => 'العفو. إذا احتجت شيء ثاني عن المنيو أنا هنا.', 'products' => [], 'suggestions' => self::SUGGESTIONS];
        }

        if (T::looksLike($effective, '/(ساع|دوام|مفتوح|بتفتح|بتقفل|وقت العمل|hours|اليوم)/')) {
            if ($catalog['hours'] === []) {
                return $this->unknown($catalog, 'ساعات العمل');
            }
            $weekday = $this->weekday($catalog['timezone']);
            $today = collect($catalog['hours'])->firstWhere('dayOfWeek', $weekday);
            $todayLine = $today ? "\nاليوم ({$today['day']}): {$today['text']}" : '';
            $rows = collect($catalog['hours'])->map(fn ($r) => "• {$r['day']}: {$r['text']}")->implode("\n");

            return ['reply' => "ساعات العمل:{$todayLine}\n{$rows}", 'products' => []];
        }

        if (T::looksLike($effective, '/(توصيل|دليفري|delivery|يوصل)/')) {
            if ($catalog['deliveryEnabled']) {
                return ['reply' => "نعم، {$copy['delivery']} متاح. أضف الأصناف للسلة ثم أتمم الطلب من المنيو.", 'products' => []];
            }

            return [
                'reply' => "{$copy['delivery']} غير مفعّل حالياً. يمكنك {$copy['pickup']} من المنيو، أو تواصل معنا للتأكيد.",
                'products' => [],
                'contact' => $this->contact($catalog),
            ];
        }

        if (T::looksLike($effective, '/(كيف اطلب|طريقة الطلب|كيف يتم الطلب|اتم الطلب|السلة|سله)/')) {
            $delivery = $catalog['deliveryEnabled'] ? "{$copy['delivery']} أو {$copy['pickup']}" : $copy['pickup'];
            $dine = $copy['dineIn'] ? " أو {$copy['dineIn']}" : '';

            return [
                'reply' => "للطلب: اختر الصنف من المنيو، حدّد الكمية، ثم افتح السلة وأتمم الطلب عبر واتساب ({$delivery}{$dine}).",
                'products' => $this->featured($catalog, 3),
            ];
        }

        if (T::looksLike($effective, '/(استلام|تيك اواي|takeaway|pickup)/')) {
            return ['reply' => "نعم، {$copy['pickup']} متاح. أضف الأصناف للسلة ثم اختر الاستلام عند إتمام الطلب.", 'products' => []];
        }

        if (T::looksLike($effective, '/(طاوله|طاولة|تناول|ديني|dine)/')) {
            if (! $copy['dineIn']) {
                return $this->unknown($catalog, 'التناول في المكان');
            }

            return ['reply' => "نعم، {$copy['dineIn']} متاح. عند إتمام الطلب أدخل رقم الطاولة.", 'products' => []];
        }

        if (T::looksLike($effective, '/(عنوان|وين موقع|الموقع|location|وينكم|مكانكم)/')) {
            if (! trim((string) $catalog['address'])) {
                return $this->unknown($catalog, 'العنوان');
            }

            return ['reply' => 'العنوان: '.trim($catalog['address']), 'products' => []];
        }

        if (T::looksLike($effective, '/(فرع|فروع|branches)/')) {
            if ($catalog['branches'] === []) {
                if (trim((string) $catalog['address'])) {
                    return ['reply' => "فرع {$catalog['restaurantName']}: ".trim($catalog['address']), 'products' => []];
                }

                return $this->unknown($catalog, 'الفروع');
            }
            $lines = collect($catalog['branches'])->map(
                fn ($b) => '• '.collect([$b['name'], $b['address'], $b['phone']])->filter()->implode(' — ')
            )->implode("\n");

            return ['reply' => "الفروع:\n{$lines}", 'products' => []];
        }

        if (T::looksLike($effective, '/(رقم|هاتف|واتساب|تواصل|phone|واتس|اتصال)/')) {
            $contact = $this->contact($catalog);
            if (! $contact) {
                return $this->unknown($catalog, 'رقم التواصل');
            }

            return [
                'reply' => "رقم التواصل: {$contact['display']}\nاضغط الزر بالأسفل للاتصال أو واتساب.",
                'products' => [],
                'contact' => $contact,
            ];
        }

        if (T::looksLike($effective, '/(دفع|كاش|بطاقه|فيزا|حواله|حجز|وظائ|شكوى|كوبون|كود خصم)/')) {
            return $this->unknown($catalog);
        }

        if (T::looksLike($effective, '/(ارخص|رخيص|اقل سعر)/')) {
            $cap = $this->priceCap($effective);
            $products = $cap !== null
                ? array_slice(array_values(array_filter($this->cheapest($catalog, 12), fn ($p) => $p['price'] <= $cap)), 0, 5)
                : $this->cheapest($catalog);

            if ($products === []) {
                return $this->unknown($catalog, 'الأسعار');
            }

            $lines = $this->lines($products);

            return [
                'reply' => $cap !== null
                    ? 'أصناف بسعر '.$this->price($cap, $products[0]['currency'])." أو أقل:\n{$lines}"
                    : "من الأقل سعراً:\n{$lines}",
                'products' => $products,
            ];
        }

        if (T::looksLike($effective, '/(اغلى|اغلي|اعلى سعر)/')) {
            $products = collect($this->visible($catalog))->where('status', 'AVAILABLE')
                ->sortByDesc('price')->take(5)->values()->all();

            if ($products === []) {
                return $this->unknown($catalog, 'الأسعار');
            }

            return ['reply' => "من الأعلى سعراً:\n".$this->lines($products), 'products' => $products];
        }

        if (T::looksLike($effective, '/(عرض|عروض|خصم|تخفيض|featured|شائع|مميز)/')) {
            $products = $this->featured($catalog);
            if ($products === []) {
                return $this->unknown($catalog, 'العروض');
            }

            return ['reply' => "العروض والأصناف المميزة:\n".$this->lines($products), 'products' => $products];
        }

        if (T::looksLike($effective, '/(اقترح|نصح|توصي|شو اطلب|ماذا تنصح)/')) {
            $products = $this->featured($catalog, 4);
            if ($products === []) {
                return $this->unknown($catalog, 'التوصيات');
            }

            return ['reply' => "أنصحك تجرب من المميز عند {$catalog['restaurantName']}:\n".$this->lines($products), 'products' => $products];
        }

        if (T::looksLike($effective, '/(اقسام|تصنيف|التصنيفات|الاقسام)/')) {
            if ($catalog['categories'] === []) {
                return $this->unknown($catalog, 'الأقسام');
            }
            $list = collect($catalog['categories'])->map(fn ($n) => "• {$n}")->implode("\n");

            return [
                'reply' => "الأقسام المتوفرة:\n{$list}\nاسألني عن أي قسم لعرض أصنافه.",
                'products' => [],
                'suggestions' => array_slice($catalog['categories'], 0, 4),
            ];
        }

        $normalizedEffective = T::normalize($effective);
        foreach ($catalog['categories'] as $name) {
            if ($name !== '' && str_contains($normalizedEffective, T::normalize($name))) {
                $products = array_slice($this->byCategory($catalog, $name), 0, 8);
                if ($products === []) {
                    return $this->unknown($catalog, "قسم {$name}");
                }

                return ['reply' => "من قسم {$name}:\n".$this->lines($products), 'products' => $products];
            }
        }

        $matches = $this->search($catalog, $effective, 5);
        if ($matches !== []) {
            $top = $matches[0];
            $extras = $top['extras'];
            $extrasLine = T::looksLike($effective, '/(اضاف|خيار|حجم)/') && $extras !== []
                ? "\nالإضافات المتوفرة لـ {$top['name_ar']}: ".implode('، ', $extras)
                : '';
            $details = T::looksLike($effective, '/(مكون|وصف|حساسيه|سعرات|كالوري)/')
                ? (trim((string) $top['description_ar']) ?: trim((string) $top['description_en']) ?: null)
                : null;

            if (T::looksLike($effective, '/(مكون|حساسيه|سعرات|كالوري)/') && ! $details && $extras === []) {
                return $this->unknown($catalog, "تفاصيل {$top['name_ar']}");
            }

            $detailLine = $details ? "\n{$details}" : '';

            return ['reply' => "هذا ما وجدته في المنيو:\n".$this->lines($matches).$detailLine.$extrasLine, 'products' => $matches];
        }

        if (T::looksLike($effective, '/(مكون|حساسيه|سعرات|كالوري)/')) {
            return $this->unknown($catalog);
        }

        if (T::looksLike($effective, '/(المنيو|شو عندكم|ماذا لديكم|الاصناف|قائمه|قائمة)/')) {
            if ($catalog['categories'] === []) {
                return $this->unknown($catalog, 'المنيو');
            }

            return [
                'reply' => "أقسام {$catalog['restaurantName']}: ".implode('، ', $catalog['categories']).".\nاسألني عن قسم أو اسم صنف.",
                'products' => $this->featured($catalog, 4),
                'suggestions' => array_slice($catalog['categories'], 0, 4),
            ];
        }

        return $this->unknown($catalog);
    }

    /** @return array{phone: ?string, whatsapp: ?string, display: string}|null */
    public function contact(array $catalog): ?array
    {
        $phone = trim((string) $catalog['phone']) ?: null;
        $whatsapp = trim((string) $catalog['whatsapp']) ?: $phone;
        $display = $phone ?: (trim((string) $catalog['whatsapp']) ?: null);

        return $display ? ['phone' => $phone, 'whatsapp' => $whatsapp, 'display' => $display] : null;
    }

    public function contactLine(array $catalog): ?string
    {
        $contact = $this->contact($catalog);
        if (! $contact) {
            return null;
        }

        return $contact['whatsapp'] && PhoneNumber::toWhatsApp($contact['whatsapp'])
            ? "تواصل معنا على {$contact['display']} أو واتساب."
            : "تواصل معنا على {$contact['display']}";
    }

    public function unknown(array $catalog, ?string $topic = null): array
    {
        $intro = $topic
            ? "ما عندي معلومات كافية عن {$topic} في المنيو."
            : 'ما قدرت أجاوب على هذا السؤال من معلومات المنيو.';
        $help = $this->contactLine($catalog);

        return [
            'reply' => $help
                ? "{$intro}\n{$help} لنساعدك مباشرة."
                : "{$intro}\nجرّب تسأل عن الأقسام أو الأسعار أو اسم صنف.",
            'products' => [],
            'contact' => $this->contact($catalog),
            'unknown' => true,
            'suggestions' => self::SUGGESTIONS,
        ];
    }

    /** @return array{delivery:string,pickup:string,dineIn:?string} */
    public function orderCopy(string $businessType): array
    {
        $venue = $businessType === 'CAFE' ? 'الكافيه' : 'المطعم';

        return [
            'delivery' => 'التوصيل',
            'pickup' => $businessType === 'SHOP' ? 'الاستلام من المحل' : 'الاستلام',
            'dineIn' => $businessType === 'SHOP' ? null : "تناول في {$venue}",
        ];
    }

    public function search(array $catalog, string $query, int $limit = 5): array
    {
        $q = T::normalize($query);
        if ($q === '') {
            return [];
        }
        $tokens = T::tokens($query);

        $scored = [];
        foreach ($this->visible($catalog) as $product) {
            $hay = T::normalize(implode(' ', array_filter([
                $product['name_ar'], $product['name_en'], $product['description_ar'],
                $product['description_en'], $product['category'], ...$product['extras'],
            ])));
            $name = T::normalize($product['name_ar']);
            $score = 0;

            if (str_contains($hay, $q) || str_contains($name, $q)) {
                $score += 90;
            }
            if ($name === $q) {
                $score += 40;
            }
            foreach ($tokens as $token) {
                if ($name === $token) {
                    $score += 28;
                } elseif (str_contains($name, $token)) {
                    $score += 18;
                } elseif (str_contains($hay, $token)) {
                    $score += 10;
                } elseif (mb_strlen($token) >= 4 && collect(explode(' ', $name))->contains(fn ($w) => str_starts_with($w, mb_substr($token, 0, 4)))) {
                    $score += 8;
                }
            }
            if ($product['is_featured']) {
                $score += 3;
            }
            if ($score >= 10) {
                $scored[] = ['product' => $product, 'score' => $score];
            }
        }

        usort($scored, fn ($a, $b) => [$b['score'], $a['product']['price']] <=> [$a['score'], $b['product']['price']]);

        return array_map(fn ($row) => $row['product'], array_slice($scored, 0, $limit));
    }

    private function visible(array $catalog): array
    {
        return array_values(array_filter($catalog['products'], fn ($p) => $p['status'] !== 'HIDDEN'));
    }

    private function byCategory(array $catalog, string $name): array
    {
        $q = T::normalize($name);

        return array_values(array_filter($this->visible($catalog), fn ($p) => str_contains(T::normalize($p['category']), $q)));
    }

    private function cheapest(array $catalog, int $limit = 5): array
    {
        return collect($this->visible($catalog))->where('status', 'AVAILABLE')
            ->sortBy('price')->take($limit)->values()->all();
    }

    private function featured(array $catalog, int $limit = 5): array
    {
        $offers = array_values(array_filter(
            $this->visible($catalog),
            fn ($p) => $p['is_featured'] || ($p['old_price'] !== null && $p['old_price'] > $p['price']),
        ));

        return array_slice($offers !== [] ? $offers : $this->cheapest($catalog, $limit), 0, $limit);
    }

    private function priceCap(string $query): ?float
    {
        return preg_match('/(?:اقل من|ارخص من|تحت|اقل ب|بحد اقصى)\s*(\d{2,7})/u', T::normalize($query), $m) ? (float) $m[1] : null;
    }

    private function isFollowUp(string $query): bool
    {
        return T::looksLike($query, '/^(وكم|والسعر|سعره|سعرها|كم سعره|كم سعرها|هذا|هيدا|الاول|الثاني|الثالث|كمان|منها|تمام|اوك|ok|نعم)$/');
    }

    private function weekday(string $timezone): int
    {
        try {
            return now($timezone ?: 'Asia/Damascus')->dayOfWeek;
        } catch (\Throwable) {
            return now()->dayOfWeek;
        }
    }

    private function lines(array $products): string
    {
        return implode("\n", array_map(function ($p) {
            $status = $p['status'] === 'UNAVAILABLE' ? ' — غير متوفر حالياً' : '';
            $offer = $p['old_price'] !== null && $p['old_price'] > $p['price']
                ? ' (بدلاً من '.$this->price($p['old_price'], $p['currency']).')'
                : '';

            return "• {$p['name_ar']} — ".$this->price($p['price'], $p['currency']).$offer.$status;
        }, $products));
    }

    public function price(float $price, string $currency = 'SYP'): string
    {
        $formatted = number_format($price, floor($price) == $price ? 0 : 2, '.', ',');

        return $formatted.' '.(self::CURRENCY_LABELS[$currency] ?? $currency);
    }
}
