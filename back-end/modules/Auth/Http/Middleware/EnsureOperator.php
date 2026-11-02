<?php

namespace Modules\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Support\MallAccess;
use Symfony\Component\HttpFoundation\Response;

/** Alias: `operator` — platform admin, or a user who manages a mall. */
class EnsureOperator
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || (! $user->isPlatformAdmin() && ! MallAccess::membership($user))) {
            throw ApiException::forbidden('هذه العملية متاحة لمديري المنصة أو مديري المولات فقط', 'OPERATOR_ONLY');
        }

        return $next($request);
    }
}
