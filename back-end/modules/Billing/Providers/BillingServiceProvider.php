<?php

namespace Modules\Billing\Providers;

use Modules\Billing\Models\Subscription;
use Modules\Billing\Services\PlanLimiter;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;

class BillingServiceProvider extends ModuleServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(EnforcesPlanLimits::class, PlanLimiter::class);
        $this->app->singleton(PlanLimiter::class);
    }

    protected function bootModule(): void
    {
        Restaurant::resolveRelationUsing('subscriptions', fn (Restaurant $r) => $r->hasMany(Subscription::class));
        Restaurant::resolveRelationUsing('currentSubscription', fn (Restaurant $r) => $r->hasOne(Subscription::class)->latestOfMany());

        // The public menu exposes plan features (branding), so refresh it on plan changes.
        $refresh = fn (Subscription $s) => RestaurantContentChanged::dispatch($s->restaurant_id);
        Subscription::saved($refresh);
        Subscription::deleted($refresh);
    }
}
