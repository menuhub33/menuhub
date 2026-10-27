<?php

namespace Modules\Analytics\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Analytics\Models\AnalyticsEvent;
use Modules\Analytics\Services\AnalyticsService;
use Modules\Audit\Http\Resources\AuditLogResource;
use Modules\Audit\Models\AuditLog;
use Modules\Catalog\Http\Resources\MenuResource;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Product;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Support\TenantContext;

class AnalyticsController extends ApiController
{
    public function __construct(
        private readonly AnalyticsService $analytics,
        private readonly EnforcesPlanLimits $limits,
    ) {}

    public function summary(Request $request, Restaurant $restaurant): JsonResponse
    {
        $this->limits->assertFeature($restaurant->id, 'analytics');

        $days = max(1, min(365, (int) $request->integer('days', 30)));
        $from = now()->subDays($days)->startOfDay();

        return $this->ok([
            'days' => $days,
            'summary' => $this->analytics->summary($restaurant->id, $from),
            'daily_views' => $this->analytics->dailyViews($restaurant->id, $from),
            'top_products' => $this->analytics->topProducts($restaurant->id, $from),
        ]);
    }

    public function events(Request $request, Restaurant $restaurant)
    {
        $this->limits->assertFeature($restaurant->id, 'analytics');

        $request->validate([
            'event_type' => ['nullable', 'string', 'max:30'],
            'menu_id' => ['nullable', 'uuid'],
            'product_id' => ['nullable', 'uuid'],
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
        ]);

        return AnalyticsEvent::query()
            ->forRestaurant($restaurant->id)
            ->when($request->filled('menu_id'), fn ($q) => $q->where('menu_id', $request->query('menu_id')))
            ->when($request->filled('product_id'), fn ($q) => $q->where('product_id', $request->query('product_id')))
            ->when($request->filled('from'), fn ($q) => $q->where('created_at', '>=', $request->date('from')->startOfDay()))
            ->when($request->filled('to'), fn ($q) => $q->where('created_at', '<=', $request->date('to')->endOfDay()))
            ->when($request->filled('event_type'), fn ($q) => $q->where('event_type', $request->query('event_type')))
            ->latest('created_at')
            ->paginate($this->perPage(50, 200));
    }

    /** Dashboard home: counts, today/month views and recent activity. */
    public function dashboard(Restaurant $restaurant): JsonResponse
    {
        $menu = Menu::query()->where('restaurant_id', $restaurant->id)
            ->orderByDesc('is_default')->orderBy('created_at')->first();

        $categoryIds = $menu ? Category::query()->where('menu_id', $menu->id)->pluck('id') : collect();
        $productCount = $categoryIds->isEmpty() ? 0 : Product::query()->whereIn('category_id', $categoryIds)->count();

        $context = TenantContext::current();
        $activity = $context?->can('audit.view')
            ? AuditLogResource::collection(
                AuditLog::query()->with('user:id,full_name')->forRestaurant($restaurant->id)->latest('created_at')->limit(8)->get()
            )->resolve()
            : [];

        return $this->ok([
            'menu' => $menu ? (new MenuResource($menu))->resolve() : null,
            'categoryCount' => $categoryIds->count(),
            'productCount' => $productCount,
            'todayViews' => $this->analytics->countViews($restaurant->id, now()->startOfDay()),
            'monthViews' => $this->analytics->countViews($restaurant->id, now()->startOfMonth()),
            'summary' => $this->analytics->summary($restaurant->id, now()->subDays(30)->startOfDay()),
            'activity' => $activity,
        ]);
    }
}
