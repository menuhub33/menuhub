<?php

namespace Modules\Audit\Providers;

use Illuminate\Support\Facades\Event;
use Modules\Audit\Listeners\RecordActivity;
use Modules\Shared\Events\ActivityRecorded;
use Modules\Shared\Support\ModuleServiceProvider;

class AuditServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        Event::listen(ActivityRecorded::class, RecordActivity::class);
    }
}
