<?php

namespace Modules\Auth\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Symfony\Component\HttpFoundation\Response;

/** Alias: `active` — blocks suspended accounts even with a valid token. */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->is_active) {
            throw ApiException::forbidden('حسابك معلّق. تواصل مع الإدارة', 'ACCOUNT_SUSPENDED');
        }

        return $next($request);
    }
}
