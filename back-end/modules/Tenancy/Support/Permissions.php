<?php

namespace Modules\Tenancy\Support;

use Modules\Shared\Enums\RestaurantRole;

/**
 * Role -> permission matrix (port of the front-end `permissions.ts`),
 * extended with `branches.manage`, `domains.manage` and `audit.view`,
 * and with the sales permissions (`pos.use`, `sales.*`, `reports.*`).
 *
 * This is the single source of truth: routes are protected with
 * `permission:{name}` so UI and API can never disagree.
 */
final class Permissions
{
    /** Sales / POS permissions (see pos-spec.md §7.2). */
    public const SALES = [
        'pos.use', 'sales.view', 'sales.create', 'sales.create_staff', 'sales.collect',
        'sales.discount', 'sales.cancel', 'sales.refund',
        'reports.sales', 'reports.own',
    ];

    public const ALL = [
        'restaurant.view', 'restaurant.update',
        'menu.view', 'menu.publish',
        'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        'products.view', 'products.create', 'products.update', 'products.delete', 'products.availability',
        'orders.view', 'orders.manage',
        'design.update', 'qr.manage',
        'analytics.view', 'audit.view',
        'staff.manage', 'subscription.manage',
        'branches.manage', 'domains.manage',
        'settings.view',
        ...self::SALES,
    ];

    private const MANAGER = [
        'restaurant.view', 'restaurant.update',
        'menu.view', 'menu.publish',
        'categories.view', 'categories.create', 'categories.update', 'categories.delete',
        'products.view', 'products.create', 'products.update', 'products.delete', 'products.availability',
        'orders.view', 'orders.manage',
        'analytics.view', 'audit.view',
        'branches.manage',
        'settings.view',
        ...self::SALES,
    ];

    private const EDITOR = [
        'restaurant.view',
        'menu.view',
        'categories.view', 'categories.create', 'categories.update',
        'products.view', 'products.create', 'products.update', 'products.availability',
        'settings.view',
    ];

    private const CASHIER = [
        'restaurant.view',
        'orders.view',
        'pos.use', 'sales.view', 'sales.create', 'sales.create_staff', 'sales.collect',
        'reports.own',
    ];

    private const WAITER = [
        'restaurant.view',
        'orders.view', 'orders.manage',
        'sales.create_staff',
    ];

    /** @return list<string> */
    public static function for(?RestaurantRole $role): array
    {
        return match ($role) {
            RestaurantRole::Owner => self::ALL,
            RestaurantRole::Manager => self::MANAGER,
            RestaurantRole::Editor => self::EDITOR,
            RestaurantRole::Cashier => self::CASHIER,
            RestaurantRole::Waiter => self::WAITER,
            default => [],
        };
    }

    public static function allows(?RestaurantRole $role, string $permission): bool
    {
        return in_array($permission, self::for($role), true);
    }
}
