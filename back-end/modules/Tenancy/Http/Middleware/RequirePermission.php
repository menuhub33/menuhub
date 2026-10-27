<?php

namespace Modules\Tenancy\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Support\TenantContext;
use Symfony\Component\HttpFoundation\Response;

/**
 * Alias: `permission:products.create` (several names = any of them).
 */
class RequirePermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $tenant = TenantContext::current();

        foreach ($permissions as $permission) {
            if ($tenant->can($permission)) {
                return $next($request);
            }
        }

        throw ApiException::forbidden('ليست لديك صلاحية لتنفيذ هذا الإجراء', 'MISSING_PERMISSION');
    }
}
