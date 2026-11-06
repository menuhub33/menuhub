<?php

namespace Modules\Catalog\Services;

use Modules\Shared\Contracts\EnforcesPlanLimits;

/**
 * Thin helper: plan limits apply only when the Billing module is enabled.
 */
class PlanGuard
{
    public function creating(string $restaurantId, string $resource): void
    {
        if (app()->bound(EnforcesPlanLimits::class)) {
            app(EnforcesPlanLimits::class)->assertCanCreate($restaurantId, $resource);
        }
    }

    public function productImageLimit(string $restaurantId): ?int
    {
        if (! app()->bound(EnforcesPlanLimits::class)) {
            return null;
        }

        return app(EnforcesPlanLimits::class)->productImageLimit($restaurantId);
    }
}
