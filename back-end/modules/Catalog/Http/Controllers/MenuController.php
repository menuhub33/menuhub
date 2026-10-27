<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Catalog\Http\Resources\MenuResource;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Services\MenuService;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\Restaurant;

class MenuController extends ApiController
{
    public function __construct(private readonly MenuService $menus) {}

    public function index(Restaurant $restaurant): JsonResponse
    {
        $menus = Menu::query()->where('restaurant_id', $restaurant->id)
            ->orderByDesc('is_default')->orderBy('created_at')->get();

        return $this->ok(MenuResource::collection($menus)->resolve());
    }

    public function show(Restaurant $restaurant, Menu $menu): JsonResponse
    {
        return $this->ok(new MenuResource($menu));
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['nullable', 'string', 'max:100', 'regex:'.Slug::PATTERN,
                Rule::unique('menus', 'slug')->where('restaurant_id', $restaurant->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        return $this->created(new MenuResource($this->menus->create($restaurant, $data)));
    }

    public function update(Request $request, Restaurant $restaurant, Menu $menu): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'slug' => ['sometimes', 'string', 'max:100', 'regex:'.Slug::PATTERN,
                Rule::unique('menus', 'slug')->where('restaurant_id', $restaurant->id)->ignore($menu->id)],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        return $this->ok(new MenuResource($this->menus->update($menu, $data)));
    }

    public function publish(Restaurant $restaurant, Menu $menu): JsonResponse
    {
        return $this->ok(new MenuResource($this->menus->publish($menu)));
    }

    public function unpublish(Restaurant $restaurant, Menu $menu): JsonResponse
    {
        return $this->ok(new MenuResource($this->menus->unpublish($menu)));
    }

    public function destroy(Restaurant $restaurant, Menu $menu): JsonResponse
    {
        $this->menus->delete($menu);

        return $this->noContent();
    }
}
