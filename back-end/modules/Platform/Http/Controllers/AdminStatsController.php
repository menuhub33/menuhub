<?php

namespace Modules\Platform\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Modules\Analytics\Models\AnalyticsEvent;
use Modules\Shared\Enums\EventType;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Tenancy\Support\MallAccess;
use Modules\Users\Models\User;

class AdminStatsController extends ApiController
{
    public function __invoke(Request $request): JsonResponse
    {
        $restaurants = MallAccess::scopeRestaurants(Restaurant::query(), $request->user());
        $ids = (clone $restaurants)->pluck('id');
        $scoped = MallAccess::limitsRestaurants($request->user());

        return $this->ok([
            'restaurants' => (clone $restaurants)->count(),
            'users' => $scoped
                ? RestaurantUser::query()->whereIn('restaurant_id', $ids)->pluck('user_id')->unique()->count()
                : User::query()->count(),
            'published' => (clone $restaurants)->where('menu_status', MenuStatus::Published->value)->count(),
            'views' => AnalyticsEvent::query()
                ->where('event_type', EventType::MenuView->value)
                ->when($scoped, fn ($q) => $q->whereIn('restaurant_id', $ids))
                ->count(),
            'by_status' => (clone $restaurants)->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')->pluck('total', 'status'),
        ]);
    }
}
