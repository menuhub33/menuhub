<?php

namespace Modules\Analytics\Models;

use Modules\Shared\Enums\EventType;
use Modules\Shared\Models\BaseModel;

/**
 * @property EventType $event_type
 */
class AnalyticsEvent extends BaseModel
{
    public const UPDATED_AT = null;

    protected $table = 'analytics_events';

    protected function casts(): array
    {
        return [
            'event_type' => EventType::class,
            'metadata' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function scopeForRestaurant($query, string $restaurantId)
    {
        return $query->where('restaurant_id', $restaurantId);
    }
}
