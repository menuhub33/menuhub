<?php

namespace Modules\Catalog\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Models\Product;

/**
 * Matches the shape consumed by the front-end (`images`, `option_groups`).
 *
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'price' => (float) $this->price,
            'old_price' => $this->old_price === null ? null : (float) $this->old_price,
            'currency' => $this->currency,
            'sort_order' => $this->sort_order,
            'status' => $this->status->value,
            'is_featured' => $this->is_featured,
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'product_id' => $image->product_id,
                'image_url' => $image->image_url,
                'sort_order' => $image->sort_order,
                'is_primary' => $image->is_primary,
            ])->values()->all()),
            'option_groups' => $this->whenLoaded('optionGroups', fn () => $this->optionGroups->map(
                fn ($group) => OptionGroupResource::make($group)->resolve()
            )->values()->all()),
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'name_ar' => $this->category->name_ar,
                'name_en' => $this->category->name_en,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
