<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Models\BaseModel;

/**
 * @property string $menu_id
 * @property bool $is_active
 */
class Category extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'categories';

    private ?string $resolvedRestaurantId = null;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(Menu::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class)->orderBy('sort_order')->orderBy('created_at');
    }

    /** Tenant scope: categories of the given restaurant. */
    public function scopeForRestaurant(Builder $query, string $restaurantId): Builder
    {
        return $query->whereHas('menu', fn (Builder $q) => $q->where('restaurant_id', $restaurantId));
    }

    public function restaurantId(): ?string
    {
        return $this->resolvedRestaurantId ??= Menu::query()->whereKey($this->menu_id)->value('restaurant_id');
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
