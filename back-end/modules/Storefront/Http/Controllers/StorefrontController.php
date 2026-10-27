<?php

namespace Modules\Storefront\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Operations\Models\CustomDomain;
use Modules\Shared\Enums\DomainStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Storefront\Services\PublicMenuService;
use Modules\Tenancy\Models\Restaurant;

class StorefrontController extends ApiController
{
    public function __construct(private readonly PublicMenuService $menus) {}

    /** The public menu state (`live` / `unavailable`). Always HTTP 200 so the client can render the reason. */
    public function show(string $slug): JsonResponse
    {
        return $this->ok($this->menus->resolve($slug))
            ->header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    }

    /** Maps a verified custom domain (or `{slug}.{root}` host) to a restaurant slug. */
    public function resolveHost(Request $request): JsonResponse
    {
        $host = strtolower(trim((string) $request->query('host')));

        if ($host === '') {
            throw new ApiException('النطاق مطلوب', 422);
        }

        $domain = CustomDomain::query()->where('domain', $host)
            ->where('status', DomainStatus::Active->value)->first();

        if ($domain) {
            $slug = Restaurant::query()->whereKey($domain->restaurant_id)->value('slug');
        } elseif (($root = config('menuhub.root_domain')) && str_ends_with($host, '.'.$root)) {
            $slug = substr($host, 0, -strlen('.'.$root));
        } else {
            $slug = null;
        }

        if (! $slug) {
            throw new ApiException('النطاق غير معروف', 404);
        }

        return $this->ok(['slug' => $slug]);
    }
}
