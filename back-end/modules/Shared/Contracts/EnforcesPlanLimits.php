<?php

namespace Modules\Shared\Contracts;

/**
 * Implemented by the Billing module. Other modules depend on this contract
 * only, so they never need to know how plans are stored.
 */
interface EnforcesPlanLimits
{
    public const MENUS = 'menus';

    public const PRODUCTS = 'products';

    public const BRANCHES = 'branches';

    public const STAFF = 'staff';

    /**
     * Throws an ApiException (HTTP 402/403) when the restaurant reached the
     * limit of its plan for the given resource.
     */
    public function assertCanCreate(string $restaurantId, string $resource): void;

    /** Throws when the plan does not include the feature (e.g. custom_domain). */
    public function assertFeature(string $restaurantId, string $feature): void;

    /**
     * Plan summary exposed to the dashboard.
     *
     * @return array<string, mixed>
     */
    public function summary(string $restaurantId): array;
}
