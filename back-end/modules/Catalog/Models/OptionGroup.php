<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Enums\OptionSelectionType;
use Modules\Shared\Models\BaseModel;

/**
 * "Size", "Add-ons"... A group of options attached to a product.
 *
 * @property OptionSelectionType $selection_type
 */
class OptionGroup extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'product_option_groups';

    protected function casts(): array
    {
        return [
            'selection_type' => OptionSelectionType::class,
            'is_required' => 'boolean',
            'min_selection' => 'integer',
            'max_selection' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(Option::class, 'option_group_id')->orderBy('sort_order');
    }

    public function scopeForRestaurant(Builder $query, string $restaurantId): Builder
    {
        return $query->whereHas('product.category.menu', fn (Builder $q) => $q->where('restaurant_id', $restaurantId));
    }

    public function auditRestaurantId(): ?string
    {
        return Product::query()->find($this->product_id)?->restaurantId();
    }

    public function contentRestaurantId(): ?string
    {
        return $this->auditRestaurantId();
    }
}
