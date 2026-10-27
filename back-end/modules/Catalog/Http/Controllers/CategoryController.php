<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Catalog\Http\Resources\CategoryResource;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Services\CategoryService;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Tenancy\Models\Restaurant;

class CategoryController extends ApiController
{
    public function __construct(private readonly CategoryService $categories) {}

    public function index(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->validate(['menu_id' => ['nullable', 'uuid'], 'with_products' => ['sometimes', 'boolean']]);

        $query = Category::query()->forRestaurant($restaurant->id)
            ->when($request->filled('menu_id'), fn ($q) => $q->where('menu_id', $request->query('menu_id')))
            ->withCount('products')
            ->orderBy('sort_order')->orderBy('created_at');

        if ($request->boolean('with_products')) {
            $query->with(['products.images', 'products.optionGroups.options']);
        }

        return $this->ok(CategoryResource::collection($query->get())->resolve());
    }

    public function show(Restaurant $restaurant, Category $category): JsonResponse
    {
        return $this->ok(new CategoryResource($category->loadCount('products')));
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate(['menu_id' => ['required', 'uuid']] + $this->rules());

        return $this->created(new CategoryResource($this->categories->create($restaurant, $data)));
    }

    public function update(Request $request, Restaurant $restaurant, Category $category): JsonResponse
    {
        $data = $request->validate(['menu_id' => ['sometimes', 'uuid']] + $this->rules(partial: true));

        return $this->ok(new CategoryResource($this->categories->update($category, $restaurant, $data)));
    }

    public function setStatus(Request $request, Restaurant $restaurant, Category $category): JsonResponse
    {
        $data = $request->validate(['is_active' => ['required', 'boolean']]);
        $category->update($data);

        return $this->ok(new CategoryResource($category));
    }

    public function reorder(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:500'],
            'items.*.id' => ['required', 'uuid'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        $this->categories->reorder($restaurant, $data['items']);

        return $this->message('تم تحديث الترتيب');
    }

    public function destroy(Restaurant $restaurant, Category $category): JsonResponse
    {
        $category->delete();

        return $this->noContent();
    }

    /** @return array<string, array<int, mixed>> */
    private function rules(bool $partial = false): array
    {
        $required = $partial ? ['sometimes', 'required'] : ['required'];

        return [
            'name_ar' => [...$required, 'string', 'max:150'],
            'name_en' => ['nullable', 'string', 'max:150'],
            'description_ar' => ['nullable', 'string', 'max:2000'],
            'description_en' => ['nullable', 'string', 'max:2000'],
            'image_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
