<?php

namespace Modules\Storefront\Services;

use Illuminate\Support\Facades\Cache;
use Modules\Catalog\Http\Resources\CategoryResource;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Operations\Models\Branch;
use Modules\Operations\Models\BusinessHour;
use Modules\Operations\Models\SocialLink;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Tenancy\Http\Resources\RestaurantResource;
use Modules\Tenancy\Models\Restaurant;
use Modules\Theming\Models\RestaurantTheme;

/**
 * Builds the public menu payload (state machine of the original
 * `getPublicMenu`): either `live` with the whole menu tree, or `unavailable`
 * with a reason. The result is cached per restaurant and invalidated through
 * {@see bump()} when the content changes.
 */
class PublicMenuService
{
    private const TTL_SECONDS = 600;

    public function __construct(private readonly EnforcesPlanLimits $limits) {}

    /** @return array<string, mixed> */
    public function resolve(string $slug): array
    {
        $slug = strtolower(trim($slug));
        $restaurant = $slug === '' ? null : Restaurant::query()->where('slug', $slug)->first();

        if (! $restaurant) {
            return ['kind' => 'unavailable', 'reason' => 'NOT_FOUND'];
        }

        return Cache::remember(
            $this->key($restaurant->id),
            self::TTL_SECONDS,
            fn () => $this->build($restaurant),
        );
    }

    /** Invalidates the cached payload of a restaurant. */
    public function bump(string $restaurantId): void
    {
        $versionKey = $this->versionKey($restaurantId);
        Cache::add($versionKey, 1, now()->addDays(30));
        Cache::increment($versionKey);
    }

    /** @return array<string, mixed> */
    private function build(Restaurant $restaurant): array
    {
        $base = ['name' => $restaurant->name, 'logo_url' => $restaurant->logo_url];

        $blocked = match ($restaurant->status) {
            RestaurantStatus::Suspended => 'SUSPENDED',
            RestaurantStatus::Expired => 'EXPIRED',
            RestaurantStatus::Cancelled => 'CANCELLED',
            default => match ($restaurant->menu_status) {
                MenuStatus::Draft => 'DRAFT',
                MenuStatus::Unpublished => 'UNPUBLISHED',
                default => null,
            },
        };

        if ($blocked) {
            return ['kind' => 'unavailable', 'reason' => $blocked] + $base;
        }

        $menus = Menu::query()->where('restaurant_id', $restaurant->id)->orderByDesc('published_at')->get();
        $menu = $menus->first(fn (Menu $m) => $m->is_default)
            ?? $menus->first(fn (Menu $m) => $m->status === MenuStatus::Published);

        if (! $menu || $menu->status !== MenuStatus::Published) {
            return ['kind' => 'unavailable', 'reason' => 'UNPUBLISHED', 'name' => $restaurant->name];
        }

        $categories = Category::query()
            ->where('menu_id', $menu->id)
            ->where('is_active', true)
            ->with([
                'products' => fn ($q) => $q->where('status', '!=', ProductStatus::Hidden->value),
                'products.images',
                'products.optionGroups',
                'products.optionGroups.options' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order'),
            ])
            ->orderBy('sort_order')->orderBy('created_at')
            ->get();

        $theme = RestaurantTheme::query()->with('theme')->where('restaurant_id', $restaurant->id)->first();
        $features = $this->limits->summary($restaurant->id)['features'];

        // The database cache unserializes objects as __PHP_Incomplete_Class, which
        // the menu page then renders as an empty product list. Store plain arrays.
        return $this->plain([
            'kind' => 'live',
            'data' => [
                'restaurant' => RestaurantResource::make($restaurant)->resolve(),
                'menu' => [
                    'id' => $menu->id,
                    'name' => $menu->name,
                    'slug' => $menu->slug,
                    'description' => $menu->description,
                    'status' => $menu->status->value,
                    'is_default' => $menu->is_default,
                    'published_at' => $menu->published_at?->toIso8601String(),
                ],
                'theme' => $theme?->toArray(),
                'categories' => CategoryResource::collection($categories)->resolve(),
                'socialLinks' => SocialLink::query()->where('restaurant_id', $restaurant->id)
                    ->where('is_active', true)->orderBy('sort_order')->get()->toArray(),
                'branches' => Branch::query()->where('restaurant_id', $restaurant->id)->where('is_active', true)
                    ->orderBy('created_at')->get(['id', 'name', 'address', 'phone', 'latitude', 'longitude'])->toArray(),
                'businessHours' => BusinessHour::query()->where('restaurant_id', $restaurant->id)
                    ->orderBy('day_of_week')->get()->toArray(),
                'branding' => ['remove_branding' => (bool) $features['remove_branding']],
            ],
        ]);
    }

    /** @param  array<string, mixed>  $payload */
    private function plain(array $payload): array
    {
        return json_decode(json_encode($payload, JSON_THROW_ON_ERROR), true, 512, JSON_THROW_ON_ERROR);
    }

    private function key(string $restaurantId): string
    {
        return "storefront:{$restaurantId}:v".Cache::get($this->versionKey($restaurantId), 1);
    }

    private function versionKey(string $restaurantId): string
    {
        return "storefront:version:{$restaurantId}";
    }
}
