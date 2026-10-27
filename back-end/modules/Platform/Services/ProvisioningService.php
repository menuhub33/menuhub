<?php

namespace Modules\Platform\Services;

use Illuminate\Support\Facades\DB;
use Modules\Billing\Services\SubscriptionService;
use Modules\Catalog\Models\Menu;
use Modules\Finance\Services\BillingService;
use Modules\Shared\Enums\BusinessType;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Support\Slug;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Tenancy\Services\RestaurantService;
use Modules\Theming\Services\ThemeService;
use Modules\Users\Services\UserService;

/**
 * Creates a complete tenant in one transaction (replaces the manual rollback
 * dance of `bootstrapRestaurant`): owner account, restaurant, membership,
 * theme, default menu, optional contract and a trial subscription.
 */
class ProvisioningService
{
    public function __construct(
        private readonly UserService $users,
        private readonly RestaurantService $restaurants,
        private readonly ThemeService $themes,
        private readonly SubscriptionService $subscriptions,
        private readonly BillingService $billing,
    ) {}

    /** @param  array<string, mixed>  $input  validated */
    public function create(array $input): Restaurant
    {
        return DB::transaction(function () use ($input) {
            $owner = $this->users->create([
                'full_name' => $input['name'],
                'email' => $input['email'],
                'password' => $input['password'],
                'phone' => $input['phone'] ?? null,
            ], verified: true);

            $slug = $this->restaurants->uniqueSlug(
                ! empty($input['slug']) ? strtolower(trim($input['slug'])) : Slug::fromName($input['name'])
            );

            $restaurant = Restaurant::query()->create([
                'name' => trim($input['name']),
                'slug' => $slug,
                'email' => strtolower(trim($input['email'])),
                'description' => $input['description'] ?? null,
                'phone' => $input['phone'] ?? null,
                'status' => RestaurantStatus::Suspended,
                'menu_status' => MenuStatus::Draft,
                'business_type' => BusinessType::normalize($input['business_type'] ?? null),
                'currency' => strtoupper($input['billing']['currency'] ?? 'SYP'),
            ]);

            RestaurantUser::query()->create([
                'restaurant_id' => $restaurant->id,
                'user_id' => $owner->id,
                'role' => RestaurantRole::Owner,
                'is_active' => true,
            ]);

            $this->themes->forRestaurant($restaurant->id);

            Menu::query()->create([
                'restaurant_id' => $restaurant->id,
                'name' => 'المنيو الرئيسي',
                'slug' => 'main',
                'is_default' => true,
                'status' => MenuStatus::Draft,
            ]);

            if (! empty($input['billing'])) {
                $this->billing->save($restaurant, $input['billing']);
            }

            $this->subscriptions->startTrial($restaurant);

            return $restaurant->refresh();
        });
    }
}
