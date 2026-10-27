<?php

namespace Modules\Catalog\Services;

use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Reorder;
use Modules\Tenancy\Models\Restaurant;

class CategoryService
{
    /** @param  array<string, mixed>  $data */
    public function create(Restaurant $restaurant, array $data): Category
    {
        $menu = $this->menuOf($restaurant, $data['menu_id']);

        $data['sort_order'] ??= (int) Category::query()->where('menu_id', $menu->id)->max('sort_order') + 1;

        return Category::query()->create([
            'menu_id' => $menu->id,
            'name_ar' => $data['name_ar'],
            'name_en' => $data['name_en'] ?? null,
            'description_ar' => $data['description_ar'] ?? null,
            'description_en' => $data['description_en'] ?? null,
            'image_url' => $data['image_url'] ?? null,
            'sort_order' => $data['sort_order'],
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /** @param  array<string, mixed>  $data */
    public function update(Category $category, Restaurant $restaurant, array $data): Category
    {
        if (isset($data['menu_id']) && $data['menu_id'] !== $category->menu_id) {
            $category->menu_id = $this->menuOf($restaurant, $data['menu_id'])->id;
        }

        $category->fill(array_intersect_key($data, array_flip([
            'name_ar', 'name_en', 'description_ar', 'description_en', 'image_url', 'sort_order', 'is_active',
        ])))->save();

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
