<?php

namespace Modules\Tenancy\Support;

use Modules\Shared\Enums\RestaurantRole;

/**
 * Role -> permission matrix (port of the front-end `permissions.ts`),
 * extended with `branches.manage`, `domains.manage` and `audit.view`.
 *
 * This is the single source of truth: routes are protected with
 * `permission:{name}` so UI and API can never disagree.
 */
final class Permissions
{
    public const ALL = [
        'restaurant.view', 'restaurant.update',
        'menu.view', 'menu.publish',
        'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        'products.view', 'products.create', 'products.update', 'products.delete', 'products.availability',
        'options.manage',
        'design.update', 'qr.manage',
        'analytics.view', 'audit.view',
        'staff.manage', 'subscription.manage',
        'branches.manage', 'domains.manage',
        'settings.view',
    ];

    private const MANAGER = [
        'restaurant.view', 'restaurant.update',
        'menu.view', 'menu.publish',
        'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        'products.view', 'products.create', 'products.update', 'products.delete', 'products.availability',
        'options.manage',
        'analytics.view', 'audit.view',
        'branches.manage',
        'settings.view',
    ];

    private const EDITOR = [
        'restaurant.view',
        'menu.view',
        'categories.view', 'categories.create', 'categories.update',
        'products.view', 'products.create', 'products.update', 'products.availability',
        'options.manage',
        'settings.view',
    ];

    /** @return list<string> */
    public static function for(?RestaurantRole $role): array
    {
        return match ($role) {
            RestaurantRole::Owner => self::ALL,
            RestaurantRole::Manager => self::MANAGER,
            RestaurantRole::Editor => self::EDITOR,
            default => [],
        };
    }

    public static function allows(?RestaurantRole $role, string $permission): bool
    {
        return in_array($permission, self::for($role), true);
    }
}
