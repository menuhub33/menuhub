<?php

namespace Modules\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Symfony\Component\HttpFoundation\Response;

/** Alias: `admin` — ADMIN or SUPER_ADMIN platform role. */
class EnsurePlatformAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isPlatformAdmin()) {
            throw ApiException::forbidden('هذه العملية متاحة لمديري المنصة فقط', 'ADMIN_ONLY');
        }

        return $next($request);
    }
}
