<?php

namespace Modules\Tenancy\Support;

use Modules\Shared\Enums\RestaurantRole;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;

/**
 * Who is acting on which restaurant. Bound per request by ResolveTenant.
 */
final class TenantContext
{
    public function __construct(
        public readonly Restaurant $restaurant,
        public readonly ?RestaurantRole $role,
        public readonly ?RestaurantUser $membership,
        /** True when a platform admin acts on a restaurant they do not belong to. */
        public readonly bool $viaAdmin = false,
    ) {}

    public static function current(): self
    {
        return app(self::class);
    }

    public function can(string $permission): bool
    {
        return $this->viaAdmin || Permissions::allows($this->role, $permission);
    }

    /** @return list<string> */
    public function permissions(): array
    {
        return $this->viaAdmin ? Permissions::ALL : Permissions::for($this->role);
    }
}
