<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

class ProductImage extends BaseModel
{
    use PublishesContentChanges;

    public const UPDATED_AT = null;

    protected $table = 'product_images';

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function scopeForRestaurant(Builder $query, string $restaurantId): Builder
    {
        return $query->whereHas('product.category.menu', fn (Builder $q) => $q->where('restaurant_id', $restaurantId));
    }

    public function contentRestaurantId(): ?string
    {
        return Product::query()->find($this->product_id)?->restaurantId();
    }
}
