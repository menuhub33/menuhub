<?php

namespace Modules\Operations\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Operations\Models\CustomDomain;
use Modules\Operations\Services\CustomDomainService;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class CustomDomainController extends ApiController
{
    public function __construct(private readonly CustomDomainService $domains) {}

    public function index(Restaurant $restaurant): JsonResponse
    {
        return $this->ok(CustomDomain::query()->where('restaurant_id', $restaurant->id)->get()
            ->map(fn (CustomDomain $domain) => $this->present($domain)));
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $request->merge(['domain' => strtolower(trim((string) $request->input('domain')))]);

        $data = $request->validate([
            'domain' => [
                'required', 'string', 'max:255', 'unique:custom_domains,domain',
                'regex:/^(?=.{4,253}$)(?!-)(?:[a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/',
            ],
        ]);

        if (app()->bound(EnforcesPlanLimits::class)) {
            app(EnforcesPlanLimits::class)->assertFeature($restaurant->id, 'custom_domain');
        }

        return $this->created($this->present($this->domains->create($restaurant, $data['domain'])));
    }

    public function verify(Restaurant $restaurant, string $domain): JsonResponse
    {
        $model = CustomDomain::query()->where('restaurant_id', $restaurant->id)->findOrFail($domain);

        return $this->ok($this->present($this->domains->verify($model)));
    }

    public function destroy(Restaurant $restaurant, string $domain): JsonResponse
    {
        CustomDomain::query()->where('restaurant_id', $restaurant->id)->findOrFail($domain)->delete();

        return $this->noContent();
    }

    /** @return array<string, mixed> */
    private function present(CustomDomain $domain): array
    {
        return [
            'id' => $domain->id,
            'domain' => $domain->domain,
            'status' => $domain->status->value,
            'verified_at' => $domain->verified_at?->toIso8601String(),
            'ssl_status' => $domain->ssl_status,
            'dns' => [
                'type' => 'TXT',
                'host' => $domain->txtHost(),
                'value' => $domain->txtValue(),
            ],
        ];
    }
}
