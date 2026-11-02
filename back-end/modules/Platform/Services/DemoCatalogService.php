<?php

namespace Modules\Platform\Services;

use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\Plan;
use Modules\Billing\Models\Subscription;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Option;
use Modules\Catalog\Models\OptionGroup;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductImage;
use Modules\Operations\Models\Branch;
use Modules\Operations\Models\BusinessHour;
use Modules\Operations\Models\SocialLink;
use Modules\Platform\Support\DemoData;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Enums\SubscriptionStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;
use Modules\Theming\Models\RestaurantTheme;
use Modules\Theming\Models\Theme;

/**
 * Builds the two public sample menus (`demo`, `demo-cars`). Idempotent: an
 * existing restaurant with the same slug is rebuilt from scratch.
 */
class DemoCatalogService
{
    public function seed(string $slug): Restaurant
    {
        $data = DemoData::get($slug) ?? throw new ApiException('المنيو التجريبي غير معروف', 404);

        return DB::transaction(function () use ($slug, $data) {
            Restaurant::query()->where('slug', $slug)->get()->each->delete();

            $restaurant = Restaurant::query()->create($data['restaurant'] + [
                'status' => RestaurantStatus::Active,
                'menu_status' => MenuStatus::Published,
            ]);

            RestaurantTheme::query()->create($data['theme'] + [
                'restaurant_id' => $restaurant->id,
                'theme_id' => Theme::query()->where('slug', 'modern')->value('id'),
            ]);

            $menu = Menu::query()->create($data['menu'] + [
                'restaurant_id' => $restaurant->id,
                'is_default' => true,
                'status' => MenuStatus::Published,
                'published_at' => now(),
            ]);

            Branch::query()->create($data['branch'] + ['restaurant_id' => $restaurant->id, 'is_active' => true]);

            foreach ($data['hours'] as $hour) {
                BusinessHour::query()->create($hour + ['restaurant_id' => $restaurant->id, 'branch_id' => null]);
            }

            foreach ($data['social_links'] as $i => $link) {
                SocialLink::query()->create($link + ['restaurant_id' => $restaurant->id, 'is_active' => true, 'sort_order' => $i]);
            }

            $folder = "/{$slug}";
            foreach ($data['categories'] as $i => $categoryData) {
                $category = Category::query()->create([
                    'menu_id' => $menu->id,
                    'name_ar' => $categoryData['name_ar'],
                    'name_en' => $categoryData['name_en'],
                    'image_url' => "{$folder}/{$categoryData['image']}",
                    'sort_order' => $i,
                    'is_active' => true,
                ]);

                foreach ($categoryData['products'] as $productData) {
                    $this->createProduct($category, $productData, $restaurant->currency, $folder);
                }
            }

            $this->ensureSubscription($restaurant);

            return $restaurant->refresh();
        });
    }

    /** @param  array<string, mixed>  $data */
    private function createProduct(Category $category, array $data, string $currency, string $folder): void
    {
        $product = Product::query()->create([
            'category_id' => $category->id,
            'name_ar' => $data['name_ar'],
            'name_en' => $data['name_en'],
            'description_ar' => $data['description_ar'],
            'price' => $data['price'],
            'old_price' => $data['old_price'],
            'currency' => $currency,
            'sort_order' => $data['sort_order'],
            'is_featured' => $data['is_featured'],
        ]);

        ProductImage::query()->create([
            'product_id' => $product->id,
            'image_url' => "{$folder}/{$data['file']}",
            'sort_order' => 0,
            'is_primary' => true,
        ]);

        $sort = 0;
        foreach ($data['opts'] as $spec) {
            [$kind, $arg] = array_pad(explode(':', $spec, 2), 2, null);

            match ($kind) {
                'size' => $this->group($product, 'الحجم', 'Size', 'SINGLE', true, 1, 1, $sort++, [
                    ['وسط', 'Medium', 0], ['كبير', 'Large', 8000],
                ]),
                'addons' => $this->group($product, 'إضافات', 'Extras', 'MULTIPLE', false, 0, 3, $sort++, [
                    ['صوص ثوم', 'Garlic sauce', 0], ['صوص باربكيو', 'BBQ sauce', 0], ['جبنة إضافية', 'Extra cheese', 3000],
                ]),
                'color' => $this->group($product, 'اللون', 'Color', 'SINGLE', true, 1, 1, $sort++, [
                    ['أبيض لؤلؤي', 'Pearl white', 0], ['أسود معدني', 'Metallic black', 400],
                    ['رمادي تيتانيوم', 'Titanium gray', 500], ['أزرق ليلي', 'Midnight blue', 700],
                ]),
                'trim' => $this->group($product, 'فئة التجهيز', 'Trim', 'SINGLE', true, 1, 1, $sort++, [
                    ['ستاندرد', 'Standard', 0], ['فل أوبشن', 'Full option', (int) $arg],
                ]),
                'extras' => $this->group($product, 'إضافات', 'Extras', 'MULTIPLE', false, 0, 4, $sort++, [
                    ['فتحة سقف', 'Sunroof', 600], ['مقاعد جلد', 'Leather seats', 800],
                    ['فحص ميكانيك شامل', 'Full inspection', 150], ['تأمين لسنة', 'One-year insurance', 400],
                ]),
            };
        }
    }

    /** @param  list<array{0:string,1:string,2:int}>  $options */
    private function group(Product $product, string $ar, string $en, string $type, bool $required, int $min, int $max, int $sort, array $options): void
    {
        $group = OptionGroup::query()->create([
            'product_id' => $product->id,
            'name_ar' => $ar,
            'name_en' => $en,
            'selection_type' => $type,
            'is_required' => $required,
            'min_selection' => $min,
            'max_selection' => $max,
            'sort_order' => $sort,
        ]);

        foreach ($options as $i => [$optionAr, $optionEn, $delta]) {
            Option::query()->create([
                'option_group_id' => $group->id,
                'name_ar' => $optionAr,
                'name_en' => $optionEn,
                'price_delta' => $delta,
                'sort_order' => $i,
                'is_active' => true,
            ]);
        }
    }

    private function ensureSubscription(Restaurant $restaurant): void
    {
        $plan = Plan::query()->where('slug', 'free')->first();

        if ($plan && ! Subscription::query()->where('restaurant_id', $restaurant->id)->exists()) {
            Subscription::query()->create([
                'restaurant_id' => $restaurant->id,
                'plan_id' => $plan->id,
                'status' => SubscriptionStatus::Active,
                'trial_ends_at' => now()->addDays(365),
            ]);
        }
    }
}
