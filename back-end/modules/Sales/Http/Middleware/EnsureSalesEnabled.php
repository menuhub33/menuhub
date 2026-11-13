<?php

namespace Modules\Sales\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Symfony\Component\HttpFoundation\Response;

/**
 * Global kill switch of the sales module (`SALES_ENABLED`).
 * While it is off the sales endpoints simply do not exist (404).
 */
class EnsureSalesEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('menuhub.sales.enabled')) {
            throw ApiException::notFound();
        }

        return $next($request);
    }
}
