<?php

namespace Modules\Billing\Services;

use Modules\Billing\Models\Plan;
use Modules\Billing\Models\Subscription;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Product;
use Modules\Media\Models\MediaFile;
use Modules\Operations\Models\Branch;
use Modules\Shared\Contracts\EnforcesPlanLimits;
use Modules\Shared\Enums\SubscriptionStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\RestaurantUser;

/**
 * Plan quotas and feature flags (NULL limit = unlimited).
 *
 * A restaurant without any live subscription falls back to the `free` plan;
 * when no plan exists at all nothing is limited.
 */
class PlanLimiter implements EnforcesPlanLimits
{
    private const LABELS = [
        self::MENUS => ['max_menus', 'قائمة'],
        self::CATEGORIES => ['max_categories', 'قسم'],
        self::PRODUCTS => ['max_products', 'منتج'],
        self::BRANCHES => ['max_branches', 'فرع'],
        self::STAFF => ['max_staff', 'عضو فريق'],
    ];

    public function assertCanCreate(string $restaurantId, string $resource): void
    {
        if (! config('menuhub.enforce_plan_limits')) {
            return;
        }

        $plan = $this->planOf($restaurantId);
        [$column, $label] = self::LABELS[$resource];
        $max = $plan?->{$column};

        if ($max !== null && $this->usage($restaurantId, $resource) >= $max) {
            throw new ApiException(
                "وصلت إلى الحد الأقصى لخطتك ({$max} {$label}). قم بترقية الخطة للمتابعة",
                403,
                'PLAN_LIMIT_REACHED',
            );
        }
    }

    public function assertStorage(string $restaurantId, int $additionalBytes): void
    {
        if (! config('menuhub.enforce_plan_limits') || $additionalBytes <= 0) {
            return;
        }

        $maxMb = $this->planOf($restaurantId)?->max_storage_mb;
        if ($maxMb === null) {
            return;
        }

        $used = (int) MediaFile::query()->where('restaurant_id', $restaurantId)->sum('bytes');
        if ($used + $additionalBytes > $maxMb * 1024 * 1024) {
            throw new ApiException(
                "وصلت إلى حد التخزين في خطتك ({$maxMb} MB). احذف صوراً أو قم بترقية الخطة",
                403,
                'PLAN_LIMIT_REACHED',
            );
        }
    }

    public function productImageLimit(string $restaurantId): ?int
    {
        if (! config('menuhub.enforce_plan_limits')) {
            return null;
        }

        return $this->planOf($restaurantId)?->max_product_images;
    }

    public function assertFeature(string $restaurantId, string $feature): void
    {
        if (! config('menuhub.enforce_plan_limits')) {
            return;
        }

        $plan = $this->planOf($restaurantId);
        $column = match ($feature) {
            'custom_domain' => 'custom_domain_enabled',
            'analytics' => 'analytics_enabled',
            'advanced_analytics' => 'advanced_analytics',
            'remove_branding' => 'remove_branding',
            default => null,
        };

        if ($plan && $column && ! $plan->{$column}) {
            throw new ApiException('هذه الميزة غير متاحة في خطتك الحالية', 403, 'PLAN_FEATURE_UNAVAILABLE');
        }
    }

    public function summary(string $restaurantId): array
    {
        $plan = $this->planOf($restaurantId);
        $subscription = $this->subscriptionOf($restaurantId);

        $limits = [];
        foreach (self::LABELS as $resource => [$column]) {
            $limits[$resource] = ['used' => $this->usage($restaurantId, $resource), 'max' => $plan?->{$column}];
        }

        $limits['storage'] = [
            'used' => (int) round($this->storageBytes($restaurantId) / 1048576),
            'max' => $plan?->max_storage_mb,
        ];

        return [
            'plan' => $plan ? ['id' => $plan->id, 'name' => $plan->name, 'slug' => $plan->slug] : null,
            'caps' => [
                'product_images' => $plan?->max_product_images,
            ],
            'subscription' => $subscription ? [
                'status' => $subscription->status->value,
                'starts_at' => $subscription->starts_at?->toIso8601String(),
                'ends_at' => $subscription->ends_at?->toIso8601String(),
                'trial_ends_at' => $subscription->trial_ends_at?->toIso8601String(),
            ] : null,
            'limits' => $limits,
            'features' => [
                'analytics' => $plan?->analytics_enabled ?? true,
                'advanced_analytics' => $plan?->advanced_analytics ?? true,
                'custom_domain' => $plan?->custom_domain_enabled ?? true,
                'remove_branding' => $plan?->remove_branding ?? false,
            ],
        ];
    }

    public function planOf(string $restaurantId): ?Plan
    {
        return $this->subscriptionOf($restaurantId)?->plan
            ?? Plan::query()->where('slug', 'free')->first();
    }

    private function subscriptionOf(string $restaurantId): ?Subscription
    {
        return Subscription::query()
            ->with('plan')
            ->where('restaurant_id', $restaurantId)
            ->whereIn('status', [
                SubscriptionStatus::Trial->value,
                SubscriptionStatus::Active->value,
                SubscriptionStatus::PastDue->value,
            ])
            ->latest('created_at')
            ->first();
    }

    private function usage(string $restaurantId, string $resource): int
    {
        return match ($resource) {
            self::MENUS => Menu::query()->where('restaurant_id', $restaurantId)->count(),
            self::CATEGORIES => Category::query()->forRestaurant($restaurantId)->count(),
            self::PRODUCTS => Product::query()->forRestaurant($restaurantId)->count(),
            self::BRANCHES => Branch::query()->where('restaurant_id', $restaurantId)->count(),
            self::STAFF => RestaurantUser::query()->where('restaurant_id', $restaurantId)->where('is_active', true)->count(),
        };
    }

    private function storageBytes(string $restaurantId): int
    {
        return (int) MediaFile::query()->where('restaurant_id', $restaurantId)->sum('bytes');
    }
}
