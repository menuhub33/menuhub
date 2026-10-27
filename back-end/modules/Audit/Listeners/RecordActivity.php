<?php

namespace Modules\Audit\Listeners;

use Illuminate\Support\Facades\DB;
use Modules\Audit\Models\AuditLog;
use Modules\Shared\Events\ActivityRecorded;

class RecordActivity
{
    public function handle(ActivityRecorded $event): void
    {
        $restaurantId = $event->restaurantId;

        // Deleting a restaurant (or a whole tenant tree) logs against a row that
        // is already gone; keep the entry without the dangling reference.
        if ($restaurantId && str_ends_with($event->action, '.deleted')
            && ! DB::table('restaurants')->where('id', $restaurantId)->exists()) {
            $restaurantId = null;
        }

        AuditLog::query()->create([
            'restaurant_id' => $restaurantId,
            'user_id' => $event->userId,
            'action' => $event->action,
            'entity_type' => $event->entityType,
            'entity_id' => $event->entityId,
            'old_data' => $event->old,
            'new_data' => $event->new,
        ]);
    }
}
