<?php

namespace Modules\Notifications\Listeners;

use Modules\Notifications\Services\NotificationService;
use Modules\Shared\Events\RestaurantStatusChanged;

class NotifyOwnersOfStatusChange
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function handle(RestaurantStatusChanged $event): void
    {
        if ($event->from === $event->to) {
            return;
        }

        [$title, $message] = match ($event->to) {
            'ACTIVE', 'TRIAL' => ['تم تفعيل نشاطك', "تم تفعيل «{$event->restaurantName}» ونشر المنيو. يمكنك الآن إدارة محتواك."],
            'SUSPENDED' => ['تم تعليق نشاطك', "تم تعليق «{$event->restaurantName}». تواصل مع الإدارة."],
            'EXPIRED' => ['انتهى اشتراكك', "انتهى اشتراك «{$event->restaurantName}»."],
            'CANCELLED' => ['تم إلغاء نشاطك', "تم إلغاء «{$event->restaurantName}»."],
            default => [null, null],
        };

        if ($title) {
            $this->notifications->notifyRestaurant($event->restaurantId, 'RESTAURANT_STATUS', $title, $message);
        }
    }
}
