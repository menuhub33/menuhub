<?php

namespace Modules\Catalog\Services;

use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Reorder;
use Modules\Tenancy\Models\Restaurant;

class CategoryService
{
    public function __construct(private readonly PlanGuard $limits) {}

    /** @param  array<string, mixed>  $data */
    public function create(Restaurant $restaurant, array $data): Category
    {
        $this->limits->creating($restaurant->id, EnforcesPlanLimits::CATEGORIES);
        $menu = $this->menuOf($restaurant, $data['menu_id']);

        $hasPosition = array_key_exists('sort_order', $data);
        $position = $hasPosition ? max(0, (int) $data['sort_order']) : null;

        $category = Category::query()->create([
            'menu_id' => $menu->id,
            'name_ar' => $data['name_ar'],
            'name_en' => $data['name_en'] ?? null,
            'description_ar' => $data['description_ar'] ?? null,
            'description_en' => $data['description_en'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'sort_order' => (int) Category::query()->where('menu_id', $menu->id)->max('sort_order') + 1,
            'is_active' => $data['is_active'] ?? true,
        ]);

        if ($position !== null) {
            Reorder::place(Category::query()->where('menu_id', $menu->id), $category->id, $position);
            $category->refresh();
        }

        return $category;
    }

    /** @param  array<string, mixed>  $data */
    public function update(Category $category, Restaurant $restaurant, array $data): Category
    {
        if (isset($data['menu_id']) && $data['menu_id'] !== $category->menu_id) {
            $category->menu_id = $this->menuOf($restaurant, $data['menu_id'])->id;
        }

        $hasPosition = array_key_exists('sort_order', $data);
        $position = $hasPosition ? max(0, (int) $data['sort_order']) : null;
        unset($data['sort_order']);

        $category->fill(array_intersect_key($data, array_flip([
            'name_ar', 'name_en', 'description_ar', 'description_en', 'image_url', 'is_active',
        ])))->save();

        if ($hasPosition) {
            Reorder::place(Category::query()->where('menu_id', $category->menu_id), $category->id, $position);
            RestaurantContentChanged::dispatch($restaurant->id);
        }

        return $category->refresh();
    }

    /** @param  list<array{id:string,sort_order:int}>  $items */
    public function reorder(Restaurant $restaurant, array $items): void
    {
        Reorder::apply(Category::query()->forRestaurant($restaurant->id), $items);
        RestaurantContentChanged::dispatch($restaurant->id);
    }

    private function menuOf(Restaurant $restaurant, string $menuId): Menu
    {
        $menu = Menu::query()->where('restaurant_id', $restaurant->id)->find($menuId);

        if (! $menu) {
            throw ApiException::invalid('القائمة غير موجودة', 'MENU_NOT_FOUND');
        }

        return $menu;
    }
}
