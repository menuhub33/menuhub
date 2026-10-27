<?php

namespace Modules\Notifications\Providers;

use Illuminate\Support\Facades\Event;
use Modules\Notifications\Listeners\NotifyOwnersOfStatusChange;
use Modules\Shared\Events\RestaurantStatusChanged;
use Modules\Shared\Support\ModuleServiceProvider;

class NotificationsServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Event::listen(RestaurantStatusChanged::class, NotifyOwnersOfStatusChange::class);
    }
}
