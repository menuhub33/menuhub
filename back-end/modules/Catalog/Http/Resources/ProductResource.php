<?php

namespace Modules\Catalog\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Catalog\Models\Product;
use Modules\Tenancy\Support\TenantContext;

/**
 * Matches the shape consumed by the front-end (`images`).
 *
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    /** Request attribute the dashboard product endpoints set; the public menu never does. */
    public const EXPOSE_COST = 'expose_product_cost';

    /** True when the signed-in member may read and write product costs. */
    public static function memberCanSeeCost(): bool
    {
        return app()->bound(TenantContext::class) && TenantContext::current()->can('reports.sales');
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'category_id' => $this->category_id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'description_ar' => $this->description_ar,
            'description_en' => $this->description_en,
            'price' => $this->price === null ? null : (float) $this->price,
            'old_price' => $this->old_price === null ? null : (float) $this->old_price,
            // Cost is a business secret: only roles that can read sales reports ever receive it.
            'cost_price' => $this->when($request->attributes->get(self::EXPOSE_COST) === true, fn () => $this->cost_price === null ? null : (float) $this->cost_price),
            'currency' => $this->currency,
            'sort_order' => $this->sort_order,
            'status' => $this->status->value,
            'is_featured' => $this->is_featured,
            'stock_quantity' => $this->stock_quantity === null ? null : (int) $this->stock_quantity,
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'product_id' => $image->product_id,
                'image_url' => $image->image_url,
                'sort_order' => $image->sort_order,
                'is_primary' => $image->is_primary,
            ])->values()->all()),
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
