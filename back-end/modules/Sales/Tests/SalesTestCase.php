<?php

namespace Modules\Sales\Tests;

use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Modules\Billing\Models\Plan;
use Modules\Billing\Services\SubscriptionService;
use Modules\Catalog\Models\Product;
use Modules\Operations\Models\Branch;
use Modules\Shared\Enums\PosMode;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Users\Models\User;

abstract class SalesTestCase extends ApiTestCase
{
    protected User $owner;

    protected Restaurant $restaurant;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('menuhub.sales.enabled', true);

        [$this->owner, $this->restaurant] = $this->makeRestaurant();
        $this->onPlan('business'); // plan quotas (staff, branches...) are unrelated to the POS package
        $this->posMode(PosMode::CashierWaiter);

        $this->product = $this->makeProduct($this->makeCategory($this->restaurant), [
            'name_ar' => 'برغر',
            'price' => 10000,
            'stock_quantity' => 10,
        ]);
    }

    /** The POS package is decided per restaurant by a platform admin (not by the plan). */
    protected function posMode(PosMode $mode): void
    {
        $this->restaurant->pos_mode = $mode;
        $this->restaurant->save();
    }

    protected function onPlan(string $slug): void
    {
        app(SubscriptionService::class)->changePlan(
            $this->restaurant,
            Plan::query()->where('slug', $slug)->firstOrFail(),
        );
    }

    protected function as(User $user): static
    {
        Sanctum::actingAs($user);

        return $this;
    }

    protected function staff(RestaurantRole $role, ?string $branchId = null): User
    {
        $user = $this->addStaff($this->restaurant, $role);
        if ($branchId) {
            RestaurantUser::query()->where('user_id', $user->id)->update(['branch_id' => $branchId]);
        }

        return $user;
    }

    protected function branch(string $name = 'الفرع الرئيسي'): Branch
    {
        return Branch::query()->create([
            'restaurant_id' => $this->restaurant->id,
            'name' => $name,
            'slug' => 'b-'.fake()->unique()->numberBetween(1, 99999),
        ]);
    }

    protected function url(string $path = '', ?Restaurant $restaurant = null): string
    {
        return $this->api('restaurants/'.($restaurant ?? $this->restaurant)->id.'/sales/'.ltrim($path, '/'));
    }

    /** @param  array<string, mixed>  $overrides */
    protected function payload(array $overrides = []): array
    {
        return $overrides + [
            'channel' => 'POS',
            'order_type' => 'TAKEAWAY',
            'items' => [['product_id' => $this->product->id, 'quantity' => 2]],
        ];
    }

    /** @param  array<string, mixed>  $payload */
    protected function sell(array $payload, ?string $key = null): TestResponse
    {
        return $this->postJson($this->url('orders'), $payload, ['Idempotency-Key' => $key ?? fake()->uuid()]);
    }

    protected function key(): string
    {
        return fake()->uuid();
    }
}
