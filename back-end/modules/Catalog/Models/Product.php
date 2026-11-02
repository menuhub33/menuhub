<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Models\BaseModel;

/**
 * @property string $category_id
 * @property ProductStatus $status
 */
class Product extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'products';

    private ?string $resolvedRestaurantId = null;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'old_price' => 'decimal:2',
            'sort_order' => 'integer',
            'is_featured' => 'boolean',
            'status' => ProductStatus::class,
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderByDesc('is_primary')->orderBy('sort_order');
    }

    public function optionGroups(): HasMany
    {
        return $this->hasMany(OptionGroup::class)->orderBy('sort_order');
    }

    public function scopeForRestaurant(Builder $query, string $restaurantId): Builder
    {
        return $query->whereHas('category.menu', fn (Builder $q) => $q->where('restaurant_id', $restaurantId));
    }

    public function restaurantId(): ?string
    {
        return $this->resolvedRestaurantId ??= Category::query()
            ->whereKey($this->category_id)
            ->first()?->restaurantId();
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurantId();
    }

    public function contentRestaurantId(): ?string
    {
        return $this->restaurantId();
    }
}
