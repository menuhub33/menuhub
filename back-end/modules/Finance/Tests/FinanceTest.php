<?php

namespace Modules\Finance\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Models\MenuInstallment;
use Modules\Finance\Support\BillingCalculator as Calc;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Tests\ApiTestCase;

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

        $renewal = $rows->firstWhere('kind.value', 'RENEWAL');
        $this->assertSame(120.0, $renewal->amount);
        $this->assertSame('2027-01-01', $renewal->due_on->toDateString());
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

    public function test_paying_a_renewal_rolls_the_next_one_forward(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();
        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/billing"), $this->payload())->assertOk();

        $renewal = MenuInstallment::query()->where('kind', 'RENEWAL')->firstOrFail();
        $this->patchJson($this->api("admin/installments/{$renewal->id}"), ['paid' => true])->assertOk();

        $pending = MenuInstallment::query()->where('kind', 'RENEWAL')->where('status', 'PENDING')->get();
        $this->assertCount(1, $pending);
        $this->assertSame('2028-01-01', $pending->first()->due_on->toDateString());
        $this->assertSame(2, $pending->first()->sequence);
        $this->assertSame('2028-01-01', MenuBilling::query()->first()->next_renewal_on->toDateString());
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
