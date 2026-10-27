<?php

namespace Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Concerns\Auditable;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Models\BaseModel;
use Modules\Users\Models\User;

/**
 * Membership of a user in a restaurant, with a restaurant role.
 *
 * @property RestaurantRole $role
 */
class RestaurantUser extends BaseModel
{
    use Auditable;

    protected $table = 'restaurant_users';

    protected function casts(): array
    {
        return [
            'role' => RestaurantRole::class,
            'is_active' => 'boolean',
        ];
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function auditRestaurantId(): ?string
    {
        return $this->restaurant_id;
    }

    public function auditEntity(): string
    {
        return 'staff';
    }
}
