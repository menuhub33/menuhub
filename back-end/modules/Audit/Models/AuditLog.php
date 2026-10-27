<?php

namespace Modules\Audit\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Models\BaseModel;
use Modules\Users\Models\User;

class AuditLog extends BaseModel
{
    public const UPDATED_AT = null;

    protected $table = 'audit_logs';

    protected function casts(): array
    {
        return [
            'old_data' => 'array',
            'new_data' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForRestaurant($query, string $restaurantId)
    {
        return $query->where('restaurant_id', $restaurantId);
    }
}
