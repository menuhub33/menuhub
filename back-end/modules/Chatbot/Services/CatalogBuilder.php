<?php

namespace Modules\Chatbot\Services;

/**
 * Flattens the public menu payload into the compact catalog the chatbot works with.
 */
class CatalogBuilder
{
    private const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    /**
     * @param  array<string, mixed>  $data  `data` of a live public menu state
     * @return array<string, mixed>
     */
    public function build(array $data): array
    {
        $restaurant = $data['restaurant'];

        $products = [];
        $categories = [];

        foreach ($data['categories'] as $category) {
            $categories[] = $category['name_ar'];

            foreach ($category['products'] ?? [] as $product) {
                $images = $product['images'] ?? [];
                $primary = collect($images)->firstWhere('is_primary', true) ?? ($images[0] ?? null);

                $products[] = [
                    'id' => $product['id'],
                    'name_ar' => $product['name_ar'],
                    'name_en' => $product['name_en'],
                    'description_ar' => $product['description_ar'],
                    'description_en' => $product['description_en'],
                    'price' => (float) $product['price'],
                    'currency' => $product['currency'],
                    'status' => $product['status'],
                    'is_featured' => (bool) $product['is_featured'],
                    'old_price' => $product['old_price'],
                    'image_url' => $primary['image_url'] ?? null,
                    'category' => $category['name_ar'],
                    'extras' => collect($product['option_groups'] ?? [])
                        ->flatMap(fn ($g) => collect($g['options'] ?? [])->where('is_active', true)->pluck('name_ar'))
                        ->values()->all(),
                ];
            }
        }

        $name = trim((string) $restaurant['chatbot_name']);

        return [
            'restaurantName' => $restaurant['name'],
            'description' => $restaurant['description'],
            'deliveryEnabled' => (bool) $restaurant['delivery_enabled'],
            'businessType' => $restaurant['business_type'] ?: 'RESTAURANT',
            'address' => $restaurant['address'],
            'phone' => $restaurant['phone'],
            'whatsapp' => $restaurant['whatsapp'],
            'timezone' => $restaurant['timezone'] ?: 'Asia/Damascus',
            'chatbotName' => $name ?: "مساعد {$restaurant['name']}",
            'welcome' => trim((string) $restaurant['chatbot_welcome'])
                ?: "مرحباً، أنا مساعد {$restaurant['name']}. اسألني عن الأصناف والأسعار والأقسام والتوصيل. إذا ما عرفت الجواب بحوّلك على رقم التواصل.",
            'hours' => $this->hours($data['businessHours'] ?? []),
            'products' => $products,
            'categories' => $categories,
            'branches' => collect($data['branches'] ?? [])->map(fn ($b) => [
                'name' => $b['name'], 'address' => $b['address'], 'phone' => $b['phone'],
            ])->all(),
        ];
    }

    /** @return list<array{day:string,dayOfWeek:int,text:string}> */
    private function hours(array $rows): array
    {
        return collect($rows)
            ->filter(fn ($r) => empty($r['branch_id']))
            ->sortBy('day_of_week')
            ->map(fn ($r) => [
                'day' => self::DAYS[$r['day_of_week']] ?? "اليوم {$r['day_of_week']}",
                'dayOfWeek' => (int) $r['day_of_week'],
                'text' => $r['is_closed']
                    ? 'مغلق'
                    : $this->time($r['open_time']).' – '.$this->time($r['close_time']),
            ])
            ->values()->all();
    }

    private function time(?string $time): string
    {
        return $time ? substr($time, 0, 5) : '؟';
    }
}
