<?php

namespace Modules\Catalog\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Catalog\Http\Resources\OptionGroupResource;
use Modules\Catalog\Models\Option;
use Modules\Catalog\Models\OptionGroup;
use Modules\Catalog\Models\Product;
use Modules\Catalog\Services\ProductService;
use Modules\Shared\Enums\OptionSelectionType;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

/**
 * Option groups ("Size", "Add-ons") and their options.
 */
class OptionController extends ApiController
{
    public function __construct(private readonly ProductService $products) {}

    public function index(Restaurant $restaurant, Product $product): JsonResponse
    {
        $groups = $product->optionGroups()->with('options')->get();

        return $this->ok(OptionGroupResource::collection($groups)->resolve());
    }

    public function storeGroup(Request $request, Restaurant $restaurant, Product $product): JsonResponse
    {
        $data = $request->validate($this->groupRules());

        $group = $this->products->saveOptionGroup($product, $data);

        foreach ($data['options'] ?? [] as $option) {
            $this->products->saveOption($group, $option);
        }

        return $this->created(new OptionGroupResource($group->load('options')));
    }

    public function updateGroup(Request $request, Restaurant $restaurant, OptionGroup $group): JsonResponse
    {
        $data = $request->validate($this->groupRules(partial: true));

        $group = $this->products->saveOptionGroup($group->product, $data, $group);

        return $this->ok(new OptionGroupResource($group->load('options')));
    }

    public function destroyGroup(Restaurant $restaurant, OptionGroup $group): JsonResponse
    {
        $group->delete();

        return $this->noContent();
    }

    public function storeOption(Request $request, Restaurant $restaurant, OptionGroup $group): JsonResponse
    {
        $data = $request->validate($this->optionRules());

        return $this->created($this->products->saveOption($group, $data));
    }

    public function updateOption(Request $request, Restaurant $restaurant, Option $option): JsonResponse
    {
        $data = $request->validate($this->optionRules(partial: true));

        return $this->ok($this->products->saveOption($option->group, $data, $option));
    }

    public function destroyOption(Restaurant $restaurant, Option $option): JsonResponse
    {
        $option->delete();

        return $this->noContent();
    }

    /** @return array<string, array<int, mixed>> */
    private function groupRules(bool $partial = false): array
    {
        return [
            'name_ar' => [$partial ? 'sometimes' : 'required', 'string', 'max:150'],
            'name_en' => ['nullable', 'string', 'max:150'],
            'selection_type' => ['sometimes', Rule::enum(OptionSelectionType::class)],
            'is_required' => ['sometimes', 'boolean'],
            'min_selection' => ['sometimes', 'integer', 'min:0'],
            'max_selection' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'options' => ['sometimes', 'array', 'max:50'],
            'options.*.name_ar' => ['required_with:options', 'string', 'max:150'],
            'options.*.name_en' => ['nullable', 'string', 'max:150'],
            'options.*.price_delta' => ['sometimes', 'numeric', 'min:-9999999999', 'max:9999999999'],
            'options.*.is_active' => ['sometimes', 'boolean'],
        ];
    }

    /** @return array<string, array<int, mixed>> */
    private function optionRules(bool $partial = false): array
    {
        return [
            'name_ar' => [$partial ? 'sometimes' : 'required', 'string', 'max:150'],
            'name_en' => ['nullable', 'string', 'max:150'],
            'price_delta' => ['sometimes', 'numeric', 'min:-9999999999', 'max:9999999999'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
