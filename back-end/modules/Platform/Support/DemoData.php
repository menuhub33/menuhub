<?php

namespace Modules\Platform\Support;

/**
 * Sample catalogs (ported from lib/demo-menu.ts and lib/demo-cars-menu.ts).
 * Image paths are served by the front-end `public/` folder.
 */
final class DemoData
{
    public const KEYS = ['demo', 'demo-cars'];

    /** @return array<string, mixed>|null */
    public static function get(string $slug): ?array
    {
        return match ($slug) {
            'demo' => self::restaurantMenu(),
            'demo-cars' => self::carsShowroom(),
            default => null,
        };
    }

    private static function hours(string $open, string $close, ?array $override = null): array
    {
        $rows = [];
        for ($day = 0; $day <= 6; $day++) {
            $rows[] = ['day_of_week' => $day, 'open_time' => $open, 'close_time' => $close, 'is_closed' => false];
        }

        foreach ($override ?? [] as $day => [$o, $c]) {
            $rows[$day]['open_time'] = $o;
            $rows[$day]['close_time'] = $c;
        }

        return $rows;
    }

    /** @param  list<string>  $opts */
    private static function p(string $ar, string $en, string $desc, int $price, string $file, int $sort, ?int $old = null, bool $featured = false, array $opts = []): array
    {
        return [
            'name_ar' => $ar, 'name_en' => $en, 'description_ar' => $desc, 'price' => $price,
            'old_price' => $old, 'file' => $file, 'sort_order' => $sort, 'is_featured' => $featured, 'opts' => $opts,
        ];
    }

    private static function restaurantMenu(): array
    {
        $addons = ['addons'];
        $size = ['size'];

        return [
            'restaurant' => [
                'name' => 'بيت الشام',
                'slug' => 'demo',
                'description' => 'مطعم شامي بروح دمشقية — مشاوي، بيتزا، مقبلات وحلويات. منيو تجريبي جاهز للعرض.',
                'phone' => '0991122334',
                'whatsapp' => '963991122334',
                'email' => 'demo@menuhub.com',
                'logo_url' => '/demo/logo.png',
                'cover_image_url' => '/demo/cover.jpg',
                'address' => 'دمشق — المالكي، شارع أبي رمانة',
                'latitude' => 33.5138,
                'longitude' => 36.2765,
                'timezone' => 'Asia/Damascus',
                'default_language' => 'ar',
                'currency' => 'SYP',
                'delivery_enabled' => true,
                'business_type' => 'RESTAURANT',
                'chatbot_enabled' => true,
                'chatbot_name' => 'مساعد بيت الشام',
                'chatbot_welcome' => 'أهلاً بك في بيت الشام. اسألني عن المشاوي، البيتزا، المقبلات أو الأسعار. إذا ما عرفت الجواب بحوّلك على رقم التواصل.',
            ],
            'menu' => ['name' => 'المنيو الرئيسي', 'slug' => 'main', 'description' => 'منيو بيت الشام التجريبي'],
            'theme' => [
                'primary_color' => '#c4a574', 'secondary_color' => '#8a6d45',
                'background_color' => '#f7f7f7', 'text_color' => '#18181b', 'font_family' => 'Expo Arabic',
            ],
            'social_links' => [
                ['platform' => 'instagram', 'url' => 'https://instagram.com/baitalsham'],
                ['platform' => 'facebook', 'url' => 'https://facebook.com/baitalsham'],
                ['platform' => 'whatsapp', 'url' => '963991122334'],
            ],
            'branch' => ['name' => 'فرع المالكي', 'slug' => 'malki', 'address' => 'دمشق — المالكي، شارع أبي رمانة', 'phone' => '0991122334'],
            'hours' => self::hours('12:00', '23:00', [4 => ['12:00', '00:00'], 5 => ['13:00', '00:00']]),
            'categories' => [
                ['name_ar' => 'المقبلات', 'name_en' => 'Appetizers', 'image' => 'fattoush.jpg', 'products' => [
                    self::p('حمص بالطحينة', 'Hummus', 'حمص كريمي مع زيت الزيتون والصنوبر.', 15000, 'hummus.jpg', 0),
                    self::p('تبولة', 'Tabbouleh', 'بقدونس، برغل ناعم، بندورة وليمون.', 14000, 'tabbouleh.jpg', 1),
                    self::p('فتوش', 'Fattoush', 'خضار موسمية مع خبز مقلي وخل الرمان.', 16000, 'fattoush.jpg', 2, featured: true),
                    self::p('رقائق جبنة', 'Cheese rolls', 'عجينة مقرمشة محشوة جبنة مع صوص غارلك.', 18000, 'cheese-rolls.jpg', 3),
                ]],
                ['name_ar' => 'المشاوي', 'name_en' => 'Grills', 'image' => 'mixed-grill.jpg', 'products' => [
                    self::p('مشكل مشاوي', 'Mixed grill', 'كباب، شيش، وكفتة مع أرز وفحم.', 75000, 'mixed-grill.jpg', 0, 85000, true, $addons),
                    self::p('شيش طاووق', 'Shish tawook', 'صدور دجاج متبّلة مشوية على الفحم.', 52000, 'shish-tawook.jpg', 1, null, true, $addons),
                    self::p('كباب حلبي', 'Aleppo kebab', 'كباب لحم غنم مع بهارات حلبية.', 58000, 'kebab.jpg', 2, null, false, $addons),
                    self::p('أجنحة دجاج', 'Chicken wings', 'أجنحة مقرمشة بصوص حار أو باربكيو.', 38000, 'wings.jpg', 3, null, false, $addons),
                ]],
                ['name_ar' => 'البيتزا', 'name_en' => 'Pizza', 'image' => 'pizza-margherita.jpg', 'products' => [
                    self::p('بيتزا مارغريتا', 'Margherita', 'صلصة طماطم، موزاريلا، وريحان.', 38000, 'pizza-margherita.jpg', 0, 45000, true, $size),
                    self::p('بيتزا بيبروني', 'Pepperoni', 'بيبروني، موزاريلا، وصلصة حارة خفيفة.', 48000, 'pizza-pepperoni.jpg', 1, null, false, $size),
                    self::p('بيتزا أربعة أجبان', 'Quattro formaggi', 'خليط أجبان غني على عجينة ذهبية.', 52000, 'pizza-four-cheese.jpg', 2, null, false, $size),
                    self::p('بيتزا دجاج باربكيو', 'BBQ chicken', 'دجاج، بصل، صوص باربكيو وجبنة.', 50000, 'pizza-chicken.jpg', 3, null, false, $size),
                ]],
                ['name_ar' => 'المشروبات', 'name_en' => 'Drinks', 'image' => 'orange-juice.jpg', 'products' => [
                    self::p('عصير برتقال طازج', 'Fresh orange', 'برتقال معصور يومياً.', 12000, 'orange-juice.jpg', 0),
                    self::p('ليموناضة بالنعناع', 'Mint lemonade', 'ليمون، نعناع، وثلج.', 10000, 'lemonade.jpg', 1),
                    self::p('قهوة', 'Coffee', 'قهوة محمّصة تقدم ساخنة.', 8000, 'coffee.jpg', 2),
                    self::p('شاي بالنعناع', 'Mint tea', 'شاي أحمر مع نعنع طازج.', 6000, 'mint-tea.jpg', 3),
                ]],
                ['name_ar' => 'الحلويات', 'name_en' => 'Desserts', 'image' => 'cheesecake.jpg', 'products' => [
                    self::p('كيك الشوكولا', 'Chocolate cake', 'كيك شوكولا غني مع صوص.', 22000, 'kunafa.jpg', 0, 26000, true),
                    self::p('بقلاوة', 'Baklava', 'عجين مقرمش، فستق وقطر.', 18000, 'baklava.jpg', 1),
                    self::p('تشيز كيك', 'Cheesecake', 'تشيز كيك بارد مع توت.', 24000, 'cheesecake.jpg', 2),
                    self::p('آيس كريم', 'Ice cream', 'ثلاث كرات حسب الاختيار.', 16000, 'ice-cream.jpg', 3),
                ]],
            ],
        ];
    }

    private static function car(string $ar, string $en, string $desc, int $price, string $file, int $sort, int $trim, ?int $old = null, bool $featured = false): array
    {
        return self::p($ar, $en, $desc, $price, $file, $sort, $old, $featured, ['color', "trim:{$trim}", 'extras']);
    }

    private static function carsShowroom(): array
    {
        return [
            'restaurant' => [
                'name' => 'أوتو الشام',
                'slug' => 'demo-cars',
                'description' => 'معرض سيارات في دمشق — موديلات 2020 وأقدم: تكاسي مثل ريو 2011، BMW، أودي، ميتسوبيشي، سنتافيه وبرادو.',
                'phone' => '0993344556',
                'whatsapp' => '963993344556',
                'email' => 'cars@menuhub.com',
                'logo_url' => '/demo-cars/logo.svg',
                'cover_image_url' => '/demo-cars/cover.jpg',
                'address' => 'دمشق — المزة، أوتوستراد المزة',
                'latitude' => 33.5042,
                'longitude' => 36.2681,
                'timezone' => 'Asia/Damascus',
                'default_language' => 'ar',
                'currency' => 'USD',
                'delivery_enabled' => false,
                'business_type' => 'SHOP',
                'chatbot_enabled' => true,
                'chatbot_name' => 'مساعد أوتو الشام',
                'chatbot_welcome' => 'أهلاً بك في أوتو الشام. اسألني عن التكاسي مثل ريو 2011، BMW، أودي، ميتسوبيشي، أو عن سنتافيه وبرادو والأسعار.',
            ],
            'menu' => ['name' => 'كتالوج السيارات', 'slug' => 'main', 'description' => 'كتالوج أوتو الشام التجريبي'],
            'theme' => [
                'primary_color' => '#1e3a5f', 'secondary_color' => '#c9a227',
                'background_color' => '#f4f6f8', 'text_color' => '#0f172a', 'font_family' => 'Expo Arabic',
            ],
            'social_links' => [
                ['platform' => 'instagram', 'url' => 'https://instagram.com/autoalsham'],
                ['platform' => 'facebook', 'url' => 'https://facebook.com/autoalsham'],
                ['platform' => 'whatsapp', 'url' => '963993344556'],
            ],
            'branch' => ['name' => 'فرع المزة', 'slug' => 'mezzeh', 'address' => 'دمشق — المزة، أوتوستراد المزة', 'phone' => '0993344556'],
            'hours' => self::hours('09:00', '21:00', [5 => ['10:00', '18:00']]),
            'categories' => [
                ['name_ar' => 'تكاسي', 'name_en' => 'Taxis', 'image' => 'rio.jpg', 'products' => [
                    self::car('كيا ريو 2011', 'Kia Rio 2011', 'تكسي شامي كلاسيكي — اقتصادية، قطع غيار متوفرة ومناسبة للعمل اليومي.', 4800, 'rio.jpg', 0, 400, 5500, true),
                    self::car('ميتسوبيشي لانسر 2011', 'Mitsubishi Lancer 2011', 'لانسر عملية للتكسي والمدينة، محرك 1.6 واستهلاك منخفض.', 6900, 'lancer.jpg', 1, 500, null, true),
                ]],
                ['name_ar' => 'سيدان', 'name_en' => 'Sedan', 'image' => 'elantra.jpg', 'products' => [
                    self::car('هيونداي إلنترا 2017', 'Hyundai Elantra 2017', 'سيدان اقتصادية بمحرك 1.6، صيانة سهلة واستهلاك منخفض.', 11800, 'elantra.jpg', 0, 900, 13200, true),
                    self::car('تويوتا كامري 2017', 'Toyota Camry 2017', 'راحة عائلية وسمعة صيانة ممتازة، مناسبة للطريق الطويل.', 14800, 'camry.jpg', 1, 1100),
                    self::car('تويوتا كورولا 2018', 'Toyota Corolla 2018', 'أكثر السيدان طلباً — قطع غيار متوفرة واعتمادية عالية.', 12600, 'corolla.jpg', 2, 850, null, true),
                    self::car('كيا سيراتو 2018', 'Kia Cerato 2018', 'سيدان عملية بضمان كيا السابق وتجهيزات مريحة.', 10900, 'cerato.jpg', 3, 750),
                ]],
                ['name_ar' => 'أوروبية', 'name_en' => 'European', 'image' => 'bmw-320.jpg', 'products' => [
                    self::car('بي إم دبليو 320i 2012', 'BMW 320i 2012', 'فئة ثالثة F30، قيادة مريحة ومناسبة كتكسي فخم أو استخدام شخصي.', 12500, 'bmw-320.jpg', 0, 1100, 13800, true),
                    self::car('بي إم دبليو 520i 2012', 'BMW 520i 2012', 'فئة خامسة واسعة، داخلية فخمة ومناسبة للطريق الطويل.', 14800, 'bmw-520.jpg', 1, 1300),
                    self::car('أودي A4 2013', 'Audi A4 2013', 'سيدان ألمانية أنيقة بمحرك توربو وتجهيزات مريحة.', 13200, 'audi-a4.jpg', 2, 1200, null, true),
                    self::car('أودي A6 2013', 'Audi A6 2013', 'فئة تنفيذية بمساحة خلفية واسعة وهدوء على الطريق.', 15500, 'audi-a6.jpg', 3, 1400),
                ]],
                ['name_ar' => 'SUV', 'name_en' => 'SUV', 'image' => 'santa-fe.jpg', 'products' => [
                    self::car('هيونداي سنتافيه 2019', 'Hyundai Santa Fe 2019', 'عائلية واسعة 7 راكب، محرك قوي ومساحة صندوق كبيرة.', 19800, 'santa-fe.jpg', 0, 1400, 21500, true),
                    self::car('كيا سبورتاج 2018', 'Kia Sportage 2018', 'كروس أوفر عملية للمدينة والسفر، استهلاك معقول.', 15200, 'sportage.jpg', 1, 1100, null, true),
                    self::car('كيا سورنتو 2017', 'Kia Sorento 2017', 'SUV عائلية بمحرك V6 وخيار دفع رباعي.', 17800, 'sorento.jpg', 2, 1300),
                    self::car('هيونداي توسان 2018', 'Hyundai Tucson 2018', 'حجم مناسب للعائلة الصغيرة، كاميرا خلفية وشاشة.', 14500, 'tucson.jpg', 3, 950),
                    self::car('ميتسوبيشي أوتلاندر 2014', 'Mitsubishi Outlander 2014', 'كروس عائلية بسبع مقاعد وخيار دفع رباعي.', 12800, 'outlander.jpg', 4, 900),
                ]],
                ['name_ar' => 'دفع رباعي', 'name_en' => '4x4', 'image' => 'prado.jpg', 'products' => [
                    self::car('تويوتا برادو 2018', 'Toyota Prado 2018', 'دفع رباعي أسطوري للسفر والطرق الوعرة، 7 راكب.', 36500, 'prado.jpg', 0, 2800, 39200, true),
                    self::car('تويوتا فورتشنر 2018', 'Toyota Fortuner 2018', 'دفع رباعي دييزل، مناسب للعائلات والعمل.', 24800, 'fortuner.jpg', 1, 1800),
                    self::car('ميتسوبيشي باجيرو 2015', 'Mitsubishi Pajero 2015', 'باجيرو طويل، قوي على الطريق ومطلوب في السوق.', 18900, 'pajero.jpg', 2, 1200),
                ]],
                ['name_ar' => 'بيك أب', 'name_en' => 'Pickup', 'image' => 'hilux.jpg', 'products' => [
                    self::car('تويوتا هايلكس 2016', 'Toyota Hilux 2016', 'بيك أب غمارتين للعمل والسفر، تحمل عالي.', 19800, 'hilux.jpg', 0, 1500),
                ]],
            ],
        ];
    }
}
