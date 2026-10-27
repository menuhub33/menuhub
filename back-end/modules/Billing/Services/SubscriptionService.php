<?php

namespace Modules\Billing\Services;

use Modules\Billing\Models\Plan;
use Modules\Billing\Models\Subscription;
use Modules\Shared\Enums\SubscriptionStatus;
use Modules\Tenancy\Models\Restaurant;

class SubscriptionService
{
    /** Starts the default trial on the free plan (no-op when it does not exist). */
    public function startTrial(Restaurant $restaurant): ?Subscription
    {
        $plan = Plan::query()->where('slug', 'free')->first();

        if (! $plan) {
            return null;
        }

        return Subscription::query()->create([
            'restaurant_id' => $restaurant->id,
            'plan_id' => $plan->id,
            'status' => SubscriptionStatus::Trial,
            'trial_ends_at' => now()->addDays((int) config('menuhub.trial_days', 14)),
        ]);
    }

    /** Moves the restaurant to another plan (updates the latest subscription). */
    public function changePlan(Restaurant $restaurant, Plan $plan, SubscriptionStatus $status = SubscriptionStatus::Active): Subscription
    {
        $current = Subscription::query()
            ->where('restaurant_id', $restaurant->id)
            ->latest('created_at')
            ->first();

        if ($current) {
            $current->forceFill(['plan_id' => $plan->id, 'status' => $status])->save();

            return $current->refresh();
        }

        return Subscription::query()->create([
            'restaurant_id' => $restaurant->id,
            'plan_id' => $plan->id,
            'status' => $status,
        ]);
    }
}
