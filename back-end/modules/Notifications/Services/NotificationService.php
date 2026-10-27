<?php

namespace Modules\Notifications\Services;

use Illuminate\Support\Facades\DB;
use Modules\Notifications\Models\Notification;

class NotificationService
{
    public function notifyUser(string $userId, string $type, string $title, string $message, ?string $restaurantId = null): Notification
    {
        return Notification::query()->create([
            'user_id' => $userId,
            'restaurant_id' => $restaurantId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
        ]);
    }

    /**
     * Notifies the active members of a restaurant that hold one of $roles.
     *
     * @param  list<string>  $roles
     */
    public function notifyRestaurant(string $restaurantId, string $type, string $title, string $message, array $roles = ['OWNER', 'MANAGER']): int
    {
        $userIds = DB::table('restaurant_users')
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->whereIn('role', $roles)
            ->pluck('user_id');

        foreach ($userIds as $userId) {
            $this->notifyUser($userId, $type, $title, $message, $restaurantId);
        }

        return $userIds->count();
    }
}
