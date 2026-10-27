<?php

namespace Modules\Catalog\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Concerns\PublishesContentChanges;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

/**
 * @property string $restaurant_id
 * @property MenuStatus $status
 * @property bool $is_default
 */
class Menu extends BaseModel
{
    use Auditable, PublishesContentChanges;

    protected $table = 'menus';

    protected function casts(): array
    {
        return [
            'status' => MenuStatus::class,
            'is_default' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class)->orderBy('sort_order')->orderBy('created_at');
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }

    public function contentRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }
}
