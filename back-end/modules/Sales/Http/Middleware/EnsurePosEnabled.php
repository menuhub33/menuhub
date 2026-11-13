<?php

namespace Modules\Sales\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Support\TenantContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias `pos.enabled`. The POS is an optional package of the restaurant
 * (`restaurants.pos_mode`, set by a platform admin), not a plan feature.
 * Must run after `tenant` (needs the TenantContext).
 *
 * - mode OFF            -> every sales endpoint answers 403 POS_NOT_ENABLED;
 * - mode CASHIER        -> waiter accounts are refused (403 WAITER_NOT_ENABLED);
 * - mode CASHIER_WAITER -> everything is available.
 */
class EnsurePosEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $context = TenantContext::current();
        $mode = $context->restaurant->pos_mode;

        if (! $mode->enabled()) {
            throw new ApiException('نقطة البيع غير مفعّلة لهذا المحل', 403, 'POS_NOT_ENABLED');
        }

        if ($context->role === RestaurantRole::Waiter && ! $mode->waiterEnabled()) {
            throw new ApiException('شاشة النادل غير مفعّلة لهذا المحل', 403, 'WAITER_NOT_ENABLED');
        }

        return $next($request);
    }
}
