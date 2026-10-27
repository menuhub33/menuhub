<?php

namespace Modules\Tenancy\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Support\TenantContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias: `tenant.active`.
 *
 * A restaurant that is not TRIAL/ACTIVE (not yet activated by an admin,
 * suspended, expired...) cannot be managed by its own staff.
 */
class EnsureRestaurantActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = TenantContext::current();

        if (! $tenant->viaAdmin && ! $tenant->restaurant->isOperational()) {
            throw ApiException::forbidden('حساب النشاط غير مفعّل بعد أو معلّق', 'RESTAURANT_INACTIVE');
        }

        return $next($request);
    }
}
