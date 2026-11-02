<?php

namespace Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\Shared\Models\BaseModel;
use Modules\Users\Models\User;

/**
 * One user manages one mall. The account stays platform_role USER.
 *
 * @property string $id
 * @property string $mall_id
 * @property string $user_id
 * @property string $role
 * @property bool $is_active
 */
class MallUser extends BaseModel
{
    protected $table = 'mall_users';

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function mall(): BelongsTo
    {
        return $this->belongsTo(Mall::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
