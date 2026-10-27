<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Catalog\Http\Resources\CategoryResource;
use Modules\Catalog\Http\Resources\MenuResource;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Product;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

/**
 * Dashboard view of the whole catalog: menus + categories + products.
 */
class CatalogController extends ApiController
{
    public function index(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate(['menu_id' => ['nullable', 'uuid']]);

        $menus = Menu::query()
            ->where('restaurant_id', $restaurant->id)
            ->orderByDesc('is_default')
            ->orderBy('created_at')
            ->get();

        $menu = $request->filled('menu_id')
            ? $menus->firstWhere('id', $request->query('menu_id'))
            : ($menus->firstWhere('is_default', true) ?? $menus->first());

        $categories = $menu
            ? $menu->categories()->with(['products.images', 'products.optionGroups.options'])->get()
            : collect();

        return $this->ok([
            'menus' => MenuResource::collection($menus)->resolve(),
            'menu' => $menu ? MenuResource::make($menu)->resolve() : null,
            'categories' => CategoryResource::collection($categories)->resolve(),
            'stats' => [
                'categories' => $categories->count(),
                'products' => Product::query()->forRestaurant($restaurant->id)->count(),
            ],
        ]);
    }
}
