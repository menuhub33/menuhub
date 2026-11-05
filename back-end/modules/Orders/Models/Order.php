<?php

namespace Modules\Orders\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\Shared\Enums\OrderStatus;
use Modules\Shared\Models\BaseModel;
use Modules\Tenancy\Models\Restaurant;

/**
 * @property OrderStatus $status
 */
class Order extends BaseModel
{
    protected $table = 'orders';

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'total' => 'decimal:2',
            'confirmed_at' => 'datetime',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
