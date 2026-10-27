<?php

namespace Modules\Notifications\Models;

use Modules\Shared\Models\BaseModel;

/**
 * In-app notification (bell icon). Not Laravel's DatabaseNotification.
 */
class Notification extends BaseModel
{
    public const UPDATED_AT = null;

    protected $table = 'notifications';

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'created_at' => 'datetime',
        ];
    }
}
