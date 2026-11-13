<?php

namespace Modules\Sales\Tests;

use Illuminate\Support\Carbon;
use Modules\Orders\Models\Order;
use Modules\Shared\Enums\RestaurantRole;

class SalesReportTest extends SalesTestCase
{
    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    /** @return array<string, string> order ids by label */
    private function scenario(): array
    {
        Carbon::setTestNow('2026-11-12 09:00:00'); // 12:00 in Damascus

        $cashier = $this->staff(RestaurantRole::Cashier);
        $waiter = $this->staff(RestaurantRole::Waiter);
        $manager = $this->staff(RestaurantRole::Manager);
        $ids = [];

        $ids['a'] = $this->as($cashier)->sell($this->payload(['payment' => ['method' => 'CASH']]))->assertCreated()->json('data.id');
        $ids['b'] = $this->sell($this->payload([
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
            'payment' => ['method' => 'CARD'],
        ]))->assertCreated()->json('data.id');
        $ids['c'] = $this->as($waiter)->sell($this->payload([
            'channel' => 'STAFF',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ]))->assertCreated()->json('data.id');

        $this->as($manager)->postJson($this->url("orders/{$ids['a']}/cancel"), ['reason' => 'خطأ', 'refund_method' => 'CASH'])->assertOk();

        return $ids;
    }

    private function report(string $name, string $query = 'period=today')
    {
        return $this->getJson($this->url("reports/{$name}?{$query}"));
    }

    public function test_summary_keeps_sales_collections_and_refunds_apart(): void
    {
        $this->scenario();

        $this->as($this->owner);
        $this->report('summary')->assertOk()
            ->assertJsonPath('data.sales_total', 20000)          // B + C (A was cancelled)
            ->assertJsonPath('data.invoices_count', 2)
            ->assertJsonPath('data.average_invoice', 10000)
            ->assertJsonPath('data.collections_total', 30000)    // A 20000 + B 10000
            ->assertJsonPath('data.refunds_total', 20000)
            ->assertJsonPath('data.net_collections', 10000)
            ->assertJsonPath('data.unpaid_total', 10000)         // C
            ->assertJsonPath('data.unpaid_invoices_count', 1)
            ->assertJsonPath('data.cancelled_count', 1);
    }

    public function test_profit_comes_from_the_cost_known_when_the_item_was_sold(): void
    {
        Carbon::setTestNow('2026-11-12 09:00:00');
        $this->as($this->owner);

        // 2 x 10000 sold while the product costs 4000 each => profit 12000.
        $this->product->forceFill(['cost_price' => 4000])->save();
        $this->sell($this->payload())->assertCreated();

        // Changing the cost later must not rewrite history.
        $this->product->forceFill(['cost_price' => 9000])->save();

        $summary = $this->report('summary')->assertOk()
            ->assertJsonPath('data.sales_total', 20000)
            ->assertJsonPath('data.cost_total', 8000)
            ->assertJsonPath('data.profit_total', 12000)
            ->assertJsonPath('data.profit_margin_percent', 60)
            ->assertJsonPath('data.cost_coverage_percent', 100)
            ->assertJsonPath('data.uncosted_items_count', 0);

        $product = $this->report('products')->assertOk()->json('data.0');
        $this->assertSame(12000, (int) $product['profit_total']);

        // A product without a cost is sold too: it lowers coverage but never invents profit.
        $plain = $this->makeProduct($this->product->category, ['name_ar' => 'مشروب', 'price' => 20000, 'stock_quantity' => 5]);
        $this->sell($this->payload(['items' => [['product_id' => $plain->id, 'quantity' => 1]]]))->assertCreated();

        $this->report('summary')->assertOk()
            ->assertJsonPath('data.sales_total', 40000)
            ->assertJsonPath('data.profit_total', 12000)
            ->assertJsonPath('data.cost_coverage_percent', 50)
            ->assertJsonPath('data.uncosted_items_count', 1);

        $rows = collect($this->report('products')->json('data'))->keyBy('name');
        $this->assertNull($rows['مشروب']['profit_total']);
        $this->assertTrue($rows['مشروب']['has_uncosted_items']);
    }
    public function test_distributions_follow_sales_for_channels_and_collections_for_methods(): void
    {
        $this->scenario();
        $this->as($this->owner);

        $channels = collect($this->report('channels')->assertOk()->json('data'))->keyBy('channel');
        $this->assertSame(10000, $channels['POS']['sales_total']);
        $this->assertSame(10000, $channels['STAFF']['sales_total']);
        $this->assertEquals(50.0, $channels['POS']['share_percent']);

        $methods = collect($this->report('payment-methods')->assertOk()->json('data'))->keyBy('method');
        $this->assertSame(20000, $methods['CASH']['collections_total']);
        $this->assertSame(10000, $methods['CARD']['collections_total']);

        $types = collect($this->report('order-types')->json('data'))->keyBy('order_type');
        $this->assertSame(2, $types['TAKEAWAY']['invoices_count']);
    }

    public function test_product_category_and_timeseries_numbers_match_the_summary(): void
    {
        $this->scenario();
        $this->as($this->owner);

        $products = $this->report('products')->assertOk()->json('data');
        $this->assertSame('برغر', $products[0]['name']);
        $this->assertSame(2, $products[0]['quantity_sold']);
        $this->assertSame(20000, $products[0]['sales_total']);

        $categories = $this->report('categories')->assertOk()->json('data');
        $this->assertSame(20000, array_sum(array_column($categories, 'sales_total')));
        $this->assertEquals(100.0, $categories[0]['share_percent']);

        $series = $this->report('timeseries')->assertOk()->json('data');
        $this->assertCount(1, $series);
        $this->assertSame('2026-11-12', $series[0]['bucket']);
        $this->assertSame(2, $series[0]['invoices_count']);
        $this->assertSame(20000, $series[0]['sales_total']);

        $hours = $this->report('timeseries', 'period=today&granularity=hour')->json('data');
        $this->assertSame('2026-11-12 12:00', $hours[0]['bucket'], 'bucketed in the restaurant time zone');
    }

    public function test_staff_report_separates_what_was_sold_from_what_was_collected(): void
    {
        $this->scenario();
        $this->as($this->owner);

        $rows = collect($this->report('staff')->assertOk()->json('data'));
        $this->assertCount(3, $rows); // waiter, cashier, manager (who did the refund)

        // The waiter opened C (10000) and collected nothing.
        $waiter = $rows->first(fn ($row) => $row['orders_count'] === 1 && $row['collections_total'] == 0);
        $this->assertNotNull($waiter);
        $this->assertEquals(10000, $waiter['sales_total']);

        // The cashier opened B (A was cancelled) but collected both A and B.
        $cashier = $rows->first(fn ($row) => $row['collections_total'] == 30000);
        $this->assertNotNull($cashier);
        $this->assertEquals(10000, $cashier['sales_total']);
        $this->assertSame(1, $cashier['orders_count']);

        // The manager sold and collected nothing, but refunded 20000.
        $manager = $rows->first(fn ($row) => $row['refunds_total'] == 20000);
        $this->assertNotNull($manager);
        $this->assertSame(0, $manager['orders_count']);
    }

    public function test_other_periods_and_legacy_orders(): void
    {
        $this->scenario();
        $this->as($this->owner);

        $this->report('summary', 'period=yesterday')->assertJsonPath('data.sales_total', 0)->assertJsonPath('data.invoices_count', 0);
        $this->report('summary', 'period=last_7_days')->assertJsonPath('data.sales_total', 20000);
        $this->report('summary', 'period=custom&from=2026-11-12&to=2026-11-12')->assertJsonPath('data.invoices_count', 2);
        $this->report('summary', 'period=custom&from=2026-01-01&to=2026-12-31')->assertJsonPath('data.invoices_count', 2);
        $this->report('summary', 'period=custom&from=2024-01-01&to=2026-12-31')->assertStatus(422);
        $this->report('summary', 'period=bogus')->assertStatus(422);

        // Legacy orders add to sales volume but never to what is still owed.
        Order::query()->where('channel', 'STAFF')->update(['is_legacy' => true]);
        $this->report('summary')
            ->assertJsonPath('data.sales_total', 20000)
            ->assertJsonPath('data.unpaid_total', 0);
    }

    public function test_cashier_has_no_access_to_the_full_reports(): void
    {
        $this->scenario();

        $this->as($this->staff(RestaurantRole::Cashier));
        foreach (['summary', 'channels', 'payment-methods', 'products', 'categories', 'staff', 'branches', 'timeseries'] as $name) {
            $this->report($name)->assertForbidden();
        }
    }

    public function test_each_cashier_gets_their_own_figures(): void
    {
        Carbon::setTestNow('2026-11-12 09:00:00');
        $cashier = $this->staff(RestaurantRole::Cashier);

        $this->as($cashier)->sell($this->payload(['payment' => ['method' => 'CASH']]))->assertCreated();
        $this->getJson($this->url('me/collections?period=today'))->assertOk()
            ->assertJsonPath('data.collections_total', 20000)
            ->assertJsonPath('data.by_method.CASH.total', 20000);

        $this->as($this->staff(RestaurantRole::Cashier))
            ->getJson($this->url('me/collections?period=today'))
            ->assertJsonPath('data.collections_total', 0);
    }

    public function test_branch_pinned_manager_cannot_widen_the_report_scope(): void
    {
        Carbon::setTestNow('2026-11-12 09:00:00');
        $a = $this->branch('أ');
        $b = $this->branch('ب');

        $this->as($this->owner);
        $this->sell($this->payload(['branch_id' => $a->id]))->assertCreated();
        $this->sell($this->payload(['branch_id' => $b->id, 'items' => [['product_id' => $this->product->id, 'quantity' => 1]]]))->assertCreated();

        $pinned = $this->staff(RestaurantRole::Manager, $a->id);
        $this->as($pinned);

        $this->report('summary')->assertJsonPath('data.invoices_count', 1);
        $this->report('summary', 'period=today&branch_id='.$b->id)->assertForbidden()->assertJsonPath('code', 'BRANCH_FORBIDDEN');

        $branches = $this->report('branches')->assertOk()->json('data');
        $this->assertCount(1, $branches);
        $this->assertSame($a->id, $branches[0]['branch_id']);
    }
}
