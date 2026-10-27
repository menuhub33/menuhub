<?php

namespace Modules\Tenancy\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Support\TenantContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias: `tenant`.
 *
 * Resolves `{restaurant}` from the route, verifies that the authenticated
 * user belongs to it (or is a platform admin) and binds a TenantContext.
 */
class ResolveTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            throw ApiException::forbidden('يجب تسجيل الدخول أولاً', 'UNAUTHENTICATED');
        }

        $param = $request->route('restaurant');
        $restaurant = $param instanceof Restaurant ? $param : Restaurant::query()->findOrFail($param);

        $membership = $restaurant->memberships()
            ->where('user_id', $user->getKey())
            ->where('is_active', true)
            ->first();

        if (! $membership && ! $user->isPlatformAdmin()) {
            throw ApiException::forbidden('لا تملك صلاحية الوصول إلى هذا النشاط', 'NOT_A_MEMBER');
        }

        app()->instance(TenantContext::class, new TenantContext(
            restaurant: $restaurant,
            role: $membership?->role ?? RestaurantRole::Owner,
            membership: $membership,
            viaAdmin: ! $membership,
        ));

        // Controllers receive the same instance the middleware resolved.
        $request->route()->setParameter('restaurant', $restaurant);

        return $next($request);
    }
}
