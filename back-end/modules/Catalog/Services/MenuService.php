<?php

namespace Modules\Catalog\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Catalog\Models\Menu;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\Restaurant;

class MenuService
{
    public function __construct(private readonly PlanGuard $limits) {}

    /**
     * @param  array{name:string,slug?:?string,description?:?string,is_default?:bool}  $data
     */
    public function create(Restaurant $restaurant, array $data): Menu
    {
        $this->limits->creating($restaurant->id, EnforcesPlanLimits::MENUS);

        return DB::transaction(function () use ($restaurant, $data) {
            $isFirst = ! Menu::query()->where('restaurant_id', $restaurant->id)->exists();
            $makeDefault = $isFirst || ($data['is_default'] ?? false);

            if ($makeDefault) {
                Menu::query()->where('restaurant_id', $restaurant->id)->update(['is_default' => false]);
            }

            return Menu::query()->create([
                'restaurant_id' => $restaurant->id,
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($restaurant, $data['slug'] ?? null, $data['name']),
                'description' => $data['description'] ?? null,
                'status' => MenuStatus::Draft,
                'is_default' => $makeDefault,
            ]);
        });
    }

    /** @param  array<string, mixed>  $data */
    public function update(Menu $menu, array $data): Menu
    {
        return DB::transaction(function () use ($menu, $data) {
            if (($data['is_default'] ?? false) && ! $menu->is_default) {
                Menu::query()->where('restaurant_id', $menu->restaurant_id)->update(['is_default' => false]);
                $menu->is_default = true;
            }

            $menu->fill(array_intersect_key($data, array_flip(['name', 'slug', 'description'])))->save();

            return $menu->refresh();
        });
    }

    public function publish(Menu $menu): Menu
    {
        $menu->forceFill(['status' => MenuStatus::Published, 'published_at' => now()])->save();
        $this->syncRestaurantStatus($menu, MenuStatus::Published);

        return $menu->refresh();
    }

    public function unpublish(Menu $menu): Menu
    {
        $menu->forceFill(['status' => MenuStatus::Unpublished])->save();
        $this->syncRestaurantStatus($menu, MenuStatus::Unpublished);

        return $menu->refresh();
    }

    public function delete(Menu $menu): void
    {
        if ($menu->is_default) {
            throw ApiException::invalid('لا يمكن حذف القائمة الرئيسية. اجعل قائمة أخرى رئيسية أولاً', 'DEFAULT_MENU');
        }

        $menu->delete();
    }

    /** The restaurant's `menu_status` mirrors its default menu. */
    private function syncRestaurantStatus(Menu $menu, MenuStatus $status): void
    {
        if ($menu->is_default) {
            Restaurant::query()->whereKey($menu->restaurant_id)->first()?->forceFill(['menu_status' => $status])->save();
        }
    }

    private function uniqueSlug(Restaurant $restaurant, ?string $slug, string $name): string
    {
        $base = $slug ? strtolower($slug) : (Str::slug($name) ?: 'menu');
        $base = Slug::isValid($base) ? $base : 'menu';
        $candidate = $base;
        $i = 2;

        while (Menu::query()->where('restaurant_id', $restaurant->id)->where('slug', $candidate)->exists()) {
            $candidate = "{$base}-{$i}";
            $i++;
        }

        return $candidate;
    }
}
