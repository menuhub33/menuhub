<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

class Option extends BaseModel
{
    use PublishesContentChanges;

    protected $table = 'product_options';

    protected function casts(): array
    {
        return [
            'price_delta' => 'decimal:2',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(OptionGroup::class, 'option_group_id');
    }

    public function scopeForRestaurant(Builder $query, string $restaurantId): Builder
    {
        return $query->whereHas('group.product.category.menu', fn (Builder $q) => $q->where('restaurant_id', $restaurantId));
    }

    public function contentRestaurantId(): ?string
    {
        return $this->group?->contentRestaurantId();
    }
}
