<?php

namespace Modules\Finance\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Billing\Models\Plan;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Models\MenuInstallment;
use Modules\Finance\Support\BillingCalculator as Calc;
use Modules\Notifications\Models\Notification;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Tenancy\Models\Mall;
use Modules\Users\Models\User;

class FinanceTest extends ApiTestCase
{
    public function test_net_price_and_profit(): void
    {
        $this->assertSame(900.0, Calc::net(1000, DiscountType::Percent, 10));
        $this->assertSame(1000.0, Calc::net(1000, DiscountType::Percent, 0));
        $this->assertSame(0.0, Calc::net(1000, DiscountType::Percent, 100));
        $this->assertSame(750.0, Calc::net(1000, DiscountType::Amount, 250));
        $this->assertSame(0.0, Calc::net(1000, DiscountType::Amount, 5000));
        $this->assertSame(1000.0, Calc::net(1000, DiscountType::None, 99));
        $this->assertSame(650.0, Calc::profit(1000, DiscountType::Amount, 250, 100));
    }

    public function test_installments_split_with_remainder_on_last(): void
    {
        $this->assertSame([100.0], Calc::installmentAmounts(100, 1));
        $this->assertSame([33.33, 33.33, 33.34], Calc::installmentAmounts(100, 3));
        $this->assertCount(24, Calc::installmentAmounts(1000, 99));
        $this->assertEqualsWithDelta(1000.0, array_sum(Calc::installmentAmounts(1000, 7)), 0.001);
    }

    public function test_add_months_matches_js_overflow_semantics(): void
    {
        $this->assertSame('2026-02-15', Calc::addMonths('2026-01-15', 1));
        $this->assertSame('2027-01-15', Calc::addMonths('2026-01-15', 12));
        $this->assertSame('2026-03-03', Calc::addMonths('2026-01-31', 1));
    }

    public function test_only_platform_admins_can_use_finance(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $this->getJson($this->api('admin/finance'))->assertForbidden();
        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), [])->assertForbidden();
    }

    public function test_saving_a_contract_generates_installments_and_renewal(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), $this->payload())
            ->assertOk();

        $billing = MenuBilling::query()->where('restaurant_id', $restaurant->id)->firstOrFail();
        $rows = MenuInstallment::query()->where('billing_id', $billing->id)->orderBy('kind')->orderBy('sequence')->get();

        $regular = $rows->where('kind.value', 'INSTALLMENT');
        $this->assertCount(3, $regular);
        $this->assertEqualsWithDelta(900.0, $regular->sum('amount'), 0.001);
        $this->assertSame('2026-01-01', $regular->first()->due_on->toDateString());
        $this->assertSame('2026-03-01', $regular->last()->due_on->toDateString());
        $this->assertNull($rows->firstWhere('kind.value', 'RENEWAL'));
        $this->assertSame('2027-01-01', $billing->next_renewal_on->toDateString());

        $this->getJson($this->api('admin/finance'))->assertOk()
            ->assertJsonPath('data.summary.USD.profit', 800)
            ->assertJsonCount(1, 'data.contracts');
    }

    public function test_contract_cannot_change_after_a_payment(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();
        $url = $this->api("admin/restaurants/{$restaurant->id}/billing");

        $this->putJson($url, $this->payload())->assertOk();

        $first = MenuInstallment::query()->where('kind', 'INSTALLMENT')->orderBy('sequence')->firstOrFail();
        $this->patchJson($this->api("admin/installments/{$first->id}"), ['paid' => true])->assertOk();
        $this->assertNotNull($first->refresh()->paid_at);

        $this->putJson($url, ['price' => 2000] + $this->payload())->assertStatus(422);
    }

    public function test_a_finished_year_stops_the_menu_until_a_new_price(): void
    {
        $admin = $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), [
            'starts_on' => '2025-01-01',
            'installments_count' => 1,
            'annual_renewal' => 0,
        ] + $this->payload())->assertOk();

        $this->artisan('menus:close-expired')->assertSuccessful();

        $restaurant->refresh();
        $this->assertSame('EXPIRED', $restaurant->status->value);
        $this->assertSame('UNPUBLISHED', $restaurant->menu_status->value);
        $this->assertSame(1, Notification::query()->where('user_id', $admin->id)->where('type', 'MENU_YEAR_ENDED')->count());

        $this->artisan('menus:close-expired')->assertSuccessful();
        $this->assertSame(1, Notification::query()->where('type', 'MENU_YEAR_ENDED')->count());

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/status"), ['status' => 'ACTIVE'])->assertStatus(422);

        $this->getJson($this->api("public/menus/{$restaurant->slug}"))
            ->assertOk()
            ->assertJsonPath('data.kind', 'unavailable')
            ->assertJsonPath('data.reason', 'EXPIRED');

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), [
            'price' => 1500,
            'starts_on' => now()->toDateString(),
            'installments_count' => 1,
        ] + $this->payload())->assertOk();

        $restaurant->refresh();
        $this->assertSame('ACTIVE', $restaurant->status->value);
        $this->assertSame('PUBLISHED', $restaurant->menu_status->value);
    }

    public function test_a_mall_store_notifies_only_the_mall_manager(): void
    {
        $admin = $this->actingAdmin();
        $this->postJson($this->api('admin/malls'), [
            'name' => 'City Mall',
            'slug' => 'city-mall-year',
            'manager' => [
                'full_name' => 'Mall Manager',
                'email' => 'mall-year@example.com',
                'password' => 'password123',
            ],
        ])->assertCreated();

        $mallId = Mall::query()->where('slug', 'city-mall-year')->value('id');
        [, $restaurant] = $this->makeRestaurant();
        $restaurant->forceFill(['mall_id' => $mallId])->save();

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), [
            'starts_on' => '2025-01-01',
            'installments_count' => 1,
        ] + $this->payload())->assertOk();

        $this->artisan('menus:close-expired')->assertSuccessful();

        $managerId = User::query()->where('email', 'mall-year@example.com')->value('id');
        $this->assertSame(1, Notification::query()->where('user_id', $managerId)->where('type', 'MENU_YEAR_ENDED')->count());
        $this->assertSame(0, Notification::query()->where('user_id', $admin->id)->where('type', 'MENU_YEAR_ENDED')->count());
    }

    public function test_invalid_discounts_are_rejected(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();
        $url = $this->api("admin/restaurants/{$restaurant->id}/billing");

        $this->putJson($url, ['discount_type' => 'PERCENT', 'discount_value' => 150] + $this->payload())->assertStatus(422);
        $this->putJson($url, ['discount_type' => 'AMOUNT', 'discount_value' => 5000] + $this->payload())->assertStatus(422);
        $this->putJson($url, ['installments_count' => 30] + $this->payload())->assertStatus(422);
    }

    public function test_mall_manager_finance_is_limited_to_their_stores(): void
    {
        $this->actingAdmin();
        $this->postJson($this->api('admin/malls'), [
            'name' => 'City Mall',
            'slug' => 'city-mall',
            'manager' => [
                'full_name' => 'Mall Manager',
                'email' => 'mall@example.com',
                'password' => 'password123',
            ],
        ])->assertCreated();

        [, $outside] = $this->makeRestaurant('Outside');
        $this->putJson($this->api("admin/restaurants/{$outside->id}/billing"), $this->payload())->assertOk();
        $outsideBilling = MenuBilling::query()->where('restaurant_id', $outside->id)->firstOrFail();

        Sanctum::actingAs(User::query()->where('email', 'mall@example.com')->firstOrFail());

        $storeId = $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Mall Cafe',
            'email' => 'cafe@example.com',
            'password' => 'password123',
        ])->assertCreated()->json('data.id');

        $this->putJson($this->api("admin/restaurants/{$storeId}/billing"), $this->payload())->assertOk();
        $this->putJson($this->api("admin/restaurants/{$outside->id}/billing"), $this->payload())->assertNotFound();
        $this->deleteJson($this->api("admin/finance/{$outsideBilling->id}"))->assertNotFound();

        $this->getJson($this->api('admin/finance'))
            ->assertOk()
            ->assertJsonCount(1, 'data.contracts')
            ->assertJsonPath('data.contracts.0.restaurant_id', $storeId)
            ->assertJsonCount(1, 'data.restaurants')
            ->assertJsonPath('data.summary.USD.contracts', 1);
    }

    public function test_a_plan_prices_the_contract_and_blocks_discount_with_installments(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();
        $pro = Plan::query()->where('slug', 'pro')->firstOrFail();

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), [
            'plan_id' => $pro->id,
            'discount_type' => 'PERCENT',
            'discount_value' => 10,
            'installments_count' => 1,
            'starts_on' => '2026-01-01',
        ])->assertOk()
            ->assertJsonPath('data.price', 100)
            ->assertJsonPath('data.currency', 'USD')
            ->assertJsonPath('data.plan_id', $pro->id)
            ->assertJsonPath('data.discount_value', 10);

        $this->assertSame('SYP', $restaurant->refresh()->currency);
        $this->assertSame(
            $pro->id,
            \Modules\Billing\Models\Subscription::query()->where('restaurant_id', $restaurant->id)->value('plan_id')
        );

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), [
            'plan_id' => $pro->id,
            'discount_type' => 'PERCENT',
            'discount_value' => 10,
            'installments_count' => 4,
            'starts_on' => '2026-01-01',
        ])->assertStatus(422)->assertJsonPath('code', 'BILLING_ADJUSTMENT');
    }

    /** @return array<string, mixed> */
    private function payload(): array
    {
        return [
            'price' => 1000,
            'setup_cost' => 100,
            'annual_renewal' => 120,
            'discount_type' => 'PERCENT',
            'discount_value' => 10,
            'installments_count' => 3,
            'starts_on' => '2026-01-01',
            'currency' => 'USD',
        ];
    }
}
