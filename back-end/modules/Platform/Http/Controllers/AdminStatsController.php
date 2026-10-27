<?php

namespace Modules\Platform\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Modules\Analytics\Models\AnalyticsEvent;
use Modules\Shared\Enums\EventType;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;

class AdminStatsController extends ApiController
{
    public function __invoke(): JsonResponse
    {
        return $this->ok([
            'restaurants' => Restaurant::query()->count(),
            'users' => User::query()->count(),
            'published' => Restaurant::query()->where('menu_status', MenuStatus::Published->value)->count(),
            'views' => AnalyticsEvent::query()->where('event_type', EventType::MenuView->value)->count(),
            'by_status' => Restaurant::query()->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')->pluck('total', 'status'),
        ]);
    }
}
