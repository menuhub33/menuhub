<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\Subscription;
use Modules\Billing\Services\PlanLimiter;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

/**
 * Read-only billing view for restaurant owners.
 */
class RestaurantBillingController extends ApiController
{
    public function __construct(private readonly PlanLimiter $limiter) {}

    public function subscription(Restaurant $restaurant): JsonResponse
    {
        $subscription = Subscription::query()->with('plan')
            ->where('restaurant_id', $restaurant->id)->latest('created_at')->first();

        return $this->ok([
            'subscription' => $subscription,
            'usage' => $this->limiter->summary($restaurant->id),
        ]);
    }

    public function invoices(Restaurant $restaurant)
    {
        return Invoice::query()->where('restaurant_id', $restaurant->id)
            ->latest('created_at')->paginate($this->perPage());
    }

    public function payments(Restaurant $restaurant)
    {
        return Payment::query()->where('restaurant_id', $restaurant->id)
            ->latest('created_at')->paginate($this->perPage());
    }
}
