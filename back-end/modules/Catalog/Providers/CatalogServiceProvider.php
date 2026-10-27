<?php

namespace Modules\Catalog\Providers;

use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Routing\Route as RouteInstance;
use Illuminate\Support\Facades\Route;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Option;
use Modules\Catalog\Models\OptionGroup;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Models\ProductImage;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;

class CatalogServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // Every child binding is scoped to the {restaurant} of the URL, so an
        // id belonging to another tenant is a plain 404 (no cross-tenant leaks).
        $this->scopedBinding('menu', fn (string $rid) => Menu::query()->where('restaurant_id', $rid));
        $this->scopedBinding('category', fn (string $rid) => Category::query()->forRestaurant($rid));
        $this->scopedBinding('product', fn (string $rid) => Product::query()->forRestaurant($rid));
        $this->scopedBinding('image', fn (string $rid) => ProductImage::query()->forRestaurant($rid));
        $this->scopedBinding('group', fn (string $rid) => OptionGroup::query()->forRestaurant($rid));
        $this->scopedBinding('option', fn (string $rid) => Option::query()->forRestaurant($rid));

        Restaurant::resolveRelationUsing('menus', fn (Restaurant $r) => $r->hasMany(Menu::class));
        Restaurant::resolveRelationUsing('defaultMenu', fn (Restaurant $r) => $r->hasOne(Menu::class)->where('is_default', true));
    }

    /**
     * @param  Closure(string): Builder  $query
     */
    private function scopedBinding(string $parameter, Closure $query): void
    {
        Route::bind($parameter, function (string $value, RouteInstance $route) use ($query) {
            $restaurant = $route->parameter('restaurant');
            $restaurantId = $restaurant instanceof Restaurant ? $restaurant->id : (string) $restaurant;

            return $query($restaurantId)->findOrFail($value);
        });
    }
}
