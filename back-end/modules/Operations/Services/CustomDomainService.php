<?php

namespace Modules\Operations\Services;

use Illuminate\Support\Str;
use Modules\Operations\Models\CustomDomain;
use Modules\Shared\Enums\DomainStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;

class CustomDomainService
{
    public function __construct(private readonly DnsTxtLookup $dns) {}

    public function create(Restaurant $restaurant, string $domain): CustomDomain
    {
        $domain = strtolower(trim($domain));
        $root = config('menuhub.root_domain');

        if ($root && ($domain === $root || str_ends_with($domain, '.'.$root))) {
            throw ApiException::invalid('لا يمكن استخدام نطاق المنصة كنطاق مخصص');
        }

        return CustomDomain::query()->create([
            'restaurant_id' => $restaurant->id,
            'domain' => $domain,
            'status' => DomainStatus::Pending,
            'verification_token' => Str::random(40),
        ]);
    }

    /**
     * Ownership check: the domain must publish a TXT record
     * `_menuhub.{domain}` = `menuhub-verify={token}`.
     */
    public function verify(CustomDomain $domain): CustomDomain
    {
        $found = in_array($domain->txtValue(), $this->dns->records($domain->txtHost()), true);

        $domain->forceFill($found
            ? ['status' => DomainStatus::Active, 'verified_at' => now(), 'ssl_status' => 'PENDING']
            : ['status' => DomainStatus::Failed]
        )->save();

        return $domain->refresh();
    }
}
