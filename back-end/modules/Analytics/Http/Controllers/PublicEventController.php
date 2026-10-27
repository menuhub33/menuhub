<?php

namespace Modules\Analytics\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Analytics\Models\AnalyticsEvent;
use Modules\Analytics\Services\AnalyticsService;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Product;
use Modules\Operations\Models\Branch;
use Modules\Shared\Enums\EventType;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

/**
 * Anonymous visitor tracking. Unlike the original (which accepted any
 * restaurant_id), the restaurant is resolved from the slug and every
 * referenced entity must belong to it.
 */
class PublicEventController extends ApiController
{
    public function store(Request $request, string $slug): JsonResponse
    {
        $restaurant = Restaurant::query()->where('slug', strtolower($slug))->first();

        if (! $restaurant || ! $restaurant->isOperational()) {
            throw new ApiException('المطعم غير متاح', 404);
        }

        $data = $request->validate([
            'event_type' => ['required', Rule::enum(EventType::class)],
            'branch_id' => ['nullable', 'uuid'],
            'menu_id' => ['nullable', 'uuid'],
            'product_id' => ['nullable', 'uuid'],
            'session_id' => ['nullable', 'string', 'max:255'],
            'visitor_id' => ['nullable', 'string', 'max:255'],
            'referrer' => ['nullable', 'string', 'max:2000'],
            'metadata' => ['nullable', 'array'],
        ]);

        if (! empty($data['menu_id']) && ! Menu::query()->where('restaurant_id', $restaurant->id)->whereKey($data['menu_id'])->exists()) {
            $data['menu_id'] = null;
        }
        if (! empty($data['branch_id']) && ! Branch::query()->where('restaurant_id', $restaurant->id)->whereKey($data['branch_id'])->exists()) {
            $data['branch_id'] = null;
        }
        if (! empty($data['product_id']) && ! Product::query()->forRestaurant($restaurant->id)->whereKey($data['product_id'])->exists()) {
            $data['product_id'] = null;
        }

        $userAgent = mb_substr((string) $request->userAgent(), 0, 500);

        AnalyticsEvent::query()->create($data + [
            'restaurant_id' => $restaurant->id,
            'user_agent' => $userAgent ?: null,
            'device_type' => AnalyticsService::deviceType($userAgent),
            'country' => $request->header('CF-IPCountry'),
            'metadata' => $data['metadata'] ?? [],
        ]);

        return $this->message('ok', 202);
    }
}
