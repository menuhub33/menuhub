<?php

namespace Modules\Sales\Tests;

use Modules\Inventory\Models\StockMovement;
use Modules\Orders\Models\Order;
use Modules\Orders\Models\OrderItem;
use Modules\Sales\Models\OrderPayment;
use Modules\Shared\Enums\PosMode;
use Modules\Shared\Enums\RestaurantRole;

class SalesOrderTest extends SalesTestCase
{
    public function test_endpoints_do_not_exist_while_the_kill_switch_is_off(): void
    {
        config()->set('menuhub.sales.enabled', false);

        $this->as($this->owner)->getJson($this->url('orders'))->assertNotFound();
    }

    public function test_restaurant_without_the_pos_package_is_rejected_on_every_sales_endpoint(): void
    {
        $this->posMode(PosMode::Off);

        $this->as($this->owner);
        $this->getJson($this->url('catalog'))->assertForbidden()->assertJsonPath('code', 'POS_NOT_ENABLED');
        $this->getJson($this->url('orders'))->assertForbidden()->assertJsonPath('code', 'POS_NOT_ENABLED');
        $this->sell($this->payload())->assertForbidden()->assertJsonPath('code', 'POS_NOT_ENABLED');
    }

    public function test_the_pos_package_does_not_depend_on_the_subscription_plan(): void
    {
        $this->onPlan('pro');

        $this->as($this->owner)->sell($this->payload())->assertCreated();
    }

    public function test_cashier_only_package_refuses_the_waiter_screen(): void
    {
        $this->posMode(PosMode::Cashier);

        // The till keeps working...
        $this->as($this->staff(RestaurantRole::Cashier))->sell($this->payload([
            'payment' => ['method' => 'CASH'],
        ]))->assertCreated();

        // ...but nobody can send waiter (STAFF) orders, and waiter accounts cannot be created.
        $this->as($this->owner);
        $this->sell($this->payload(['channel' => 'STAFF']))->assertForbidden()->assertJsonPath('code', 'WAITER_NOT_ENABLED');
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'waiter@example.com', 'role' => 'WAITER', 'full_name' => 'Waiter', 'password' => 'password123',
        ])->assertStatus(422)->assertJsonPath('code', 'WAITER_NOT_ENABLED');
    }

    public function test_existing_waiters_are_blocked_when_the_package_is_downgraded(): void
    {
        $waiter = $this->staff(RestaurantRole::Waiter);
        $this->as($waiter)->sell($this->payload(['channel' => 'STAFF']))->assertCreated();

        $this->posMode(PosMode::Cashier);

        $this->as($waiter)->getJson($this->url('catalog'))->assertForbidden()->assertJsonPath('code', 'WAITER_NOT_ENABLED');
    }

    public function test_cashier_accounts_need_the_pos_package(): void
    {
        $this->posMode(PosMode::Off);

        $this->as($this->owner)->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'cashier@example.com', 'role' => 'CASHIER', 'full_name' => 'Cashier', 'password' => 'password123',
        ])->assertStatus(422)->assertJsonPath('code', 'POS_NOT_ENABLED');
    }

    public function test_only_a_platform_admin_can_set_the_pos_package(): void
    {
        $url = $this->api("admin/restaurants/{$this->restaurant->id}/pos-mode");

        // The restaurant owner can neither enable nor change it.
        $this->as($this->owner)->putJson($url, ['pos_mode' => 'OFF'])->assertForbidden();
        $this->assertSame(PosMode::CashierWaiter, $this->restaurant->refresh()->pos_mode);

        $this->actingAdmin();
        $this->putJson($url, ['pos_mode' => 'CASHIER'])->assertOk()->assertJsonPath('data.pos_mode', 'CASHIER');
        $this->assertSame(PosMode::Cashier, $this->restaurant->refresh()->pos_mode);

        $this->putJson($url, ['pos_mode' => 'NOPE'])->assertStatus(422);
    }
    public function test_cash_sale_is_confirmed_paid_and_takes_stock_out_atomically(): void
    {
        $cashier = $this->staff(RestaurantRole::Cashier);

        $response = $this->as($cashier)->sell($this->payload([
            'payment' => ['method' => 'CASH', 'tendered_amount' => 25000],
        ]))->assertCreated()
            ->assertJsonPath('data.number', 'S-000001')
            ->assertJsonPath('data.status', 'CONFIRMED')
            ->assertJsonPath('data.fulfillment_status', 'CONFIRMED')
            ->assertJsonPath('data.payment_status', 'PAID')
            ->assertJsonPath('data.channel', 'POS')
            ->assertJsonPath('data.order_type', 'TAKEAWAY')
            ->assertJsonPath('data.total', 20000)
            ->assertJsonPath('data.paid_amount', 20000)
            ->assertJsonPath('data.balance_due', 0)
            ->assertJsonPath('data.payments.0.type', 'COLLECTION')
            ->assertJsonPath('data.payments.0.change_amount', 5000);

        $this->assertSame(8, $this->product->refresh()->stock_quantity);

        $id = $response->json('data.id');
        $this->assertDatabaseHas('stock_movements', ['order_id' => $id, 'reason' => 'SALE', 'quantity_delta' => -2, 'stock_after' => 8]);
        $this->assertSame($cashier->id, Order::query()->findOrFail($id)->opened_by);
        $this->assertSame($cashier->id, Order::query()->findOrFail($id)->cashier_id);
        $this->assertNotNull(Order::query()->findOrFail($id)->inventory_deducted_at);
    }

    public function test_a_failed_sale_leaves_no_trace(): void
    {
        $this->as($this->staff(RestaurantRole::Cashier))
            ->sell($this->payload(['items' => [['product_id' => $this->product->id, 'quantity' => 11]]]))
            ->assertStatus(422)
            ->assertJsonPath('code', 'INSUFFICIENT_STOCK');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(10, $this->product->refresh()->stock_quantity);
        $this->assertSame(0, StockMovement::query()->count());
    }

    public function test_server_prices_the_cart_and_ignores_client_prices(): void
    {
        $this->as($this->owner)->sell($this->payload([
            'items' => [['product_id' => $this->product->id, 'quantity' => 1, 'unit_price' => 1]],
        ]))->assertCreated()->assertJsonPath('data.total', 10000);
    }

    public function test_replaying_the_same_idempotency_key_creates_one_invoice_and_one_deduction(): void
    {
        $this->as($this->owner);
        $key = $this->key();
        $payload = $this->payload(['payment' => ['method' => 'CARD']]);

        $first = $this->sell($payload, $key)->assertCreated();
        $second = $this->sell($payload, $key)->assertOk()->assertHeader('Idempotent-Replay', 'true');

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, Order::query()->count());
        $this->assertSame(1, OrderPayment::query()->count());
        $this->assertSame(8, $this->product->refresh()->stock_quantity);

        $this->sell($this->payload(['notes' => 'different']), $key)
            ->assertStatus(409)
            ->assertJsonPath('code', 'IDEMPOTENCY_KEY_REUSED');
    }

    public function test_idempotency_key_is_mandatory(): void
    {
        $this->as($this->owner)
            ->postJson($this->url('orders'), $this->payload())
            ->assertStatus(422)
            ->assertJsonPath('code', 'IDEMPOTENCY_KEY_REQUIRED');
    }

    public function test_waiter_order_is_confirmed_unpaid_and_waits_for_the_cashier(): void
    {
        $waiter = $this->staff(RestaurantRole::Waiter);

        $id = $this->as($waiter)->sell($this->payload([
            'channel' => 'STAFF',
            'order_type' => 'DINE_IN',
            'table_number' => '7',
            'notes' => 'بدون بصل',
        ]))->assertCreated()
            ->assertJsonPath('data.payment_status', 'UNPAID')
            ->assertJsonPath('data.status', 'CONFIRMED')
            ->assertJsonPath('data.table_number', '7')
            ->json('data.id');

        $this->assertSame(8, $this->product->refresh()->stock_quantity);

        $cashier = $this->staff(RestaurantRole::Cashier);
        $this->as($cashier)->getJson($this->url('orders/unpaid'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $id);

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CASH', 'amount' => 5000], ['Idempotency-Key' => $this->key()])
            ->assertCreated()
            ->assertJsonPath('data.payment_status', 'PARTIAL')
            ->assertJsonPath('data.balance_due', 15000);

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CARD', 'amount' => 20000], ['Idempotency-Key' => $this->key()])
            ->assertStatus(422)
            ->assertJsonPath('code', 'OVERPAYMENT');

        $this->postJson($this->url("orders/{$id}/payments"), ['method' => 'CARD'], ['Idempotency-Key' => $this->key()])
            ->assertCreated()
            ->assertJsonPath('data.payment_status', 'PAID')
            ->assertJsonPath('data.paid_amount', 20000);

        $this->getJson($this->url('orders/unpaid'))->assertJsonCount(0, 'data');
    }

    public function test_waiter_cannot_discount_collect_or_use_other_channels_or_browse_invoices(): void
    {
        $waiter = $this->staff(RestaurantRole::Waiter);
        $this->as($waiter);

        $this->sell($this->payload(['channel' => 'POS']))->assertForbidden();
        $this->sell($this->payload([
            'channel' => 'STAFF',
            'discount' => ['type' => 'PERCENT', 'value' => 10],
        ]))->assertForbidden()->assertJsonPath('code', 'DISCOUNT_NOT_ALLOWED');
        $this->sell($this->payload([
            'channel' => 'STAFF',
            'payment' => ['method' => 'CASH'],
        ]))->assertForbidden();

        $this->getJson($this->url('orders'))->assertForbidden();
        $this->getJson($this->url('orders/unpaid'))->assertForbidden();
        $this->getJson($this->url('catalog'))->assertOk();
    }

    public function test_editor_has_no_access_to_pos(): void
    {
        $editor = $this->staff(RestaurantRole::Editor);

        $this->as($editor)->getJson($this->url('catalog'))->assertForbidden();
        $this->sell($this->payload())->assertForbidden();
        $this->getJson($this->url('orders'))->assertForbidden();
    }

    public function test_cashier_cannot_discount_cancel_or_refund(): void
    {
        $cashier = $this->staff(RestaurantRole::Cashier);
        $this->as($cashier);

        $this->sell($this->payload(['discount' => ['type' => 'FIXED', 'value' => 100]]))
            ->assertForbidden()
            ->assertJsonPath('code', 'DISCOUNT_NOT_ALLOWED');

        $id = $this->sell($this->payload(['payment' => ['method' => 'CASH']]))->assertCreated()->json('data.id');

        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'خطأ'])->assertForbidden();
        $this->postJson($this->url("orders/{$id}/refunds"), ['method' => 'CASH', 'reason' => 'خطأ'], ['Idempotency-Key' => $this->key()])
            ->assertForbidden();
    }

    public function test_manager_discount_is_recorded_and_line_nets_add_up_to_the_total(): void
    {
        $manager = $this->staff(RestaurantRole::Manager);
        $other = $this->makeProduct($this->product->category, ['name_ar' => 'بيتزا', 'price' => 3333, 'stock_quantity' => null]);

        $response = $this->as($manager)->sell($this->payload([
            'items' => [
                ['product_id' => $this->product->id, 'quantity' => 3],
                ['product_id' => $other->id, 'quantity' => 1, 'discount' => ['type' => 'FIXED', 'value' => 333]],
            ],
            'discount' => ['type' => 'PERCENT', 'value' => 10, 'note' => 'عميل دائم'],
        ]))->assertCreated();

        // subtotal 33333, item discount 333, order discount = 10% of 33000 = 3300
        $response->assertJsonPath('data.subtotal', 33333)
            ->assertJsonPath('data.discount_total', 3633)
            ->assertJsonPath('data.total', 29700);

        $order = Order::query()->findOrFail($response->json('data.id'));
        $this->assertSame($manager->id, $order->discount_approved_by);
        $this->assertSame('عميل دائم', $order->discount_note);

        $netCents = OrderItem::query()->where('order_id', $order->id)->get()->sum(fn ($i) => (int) round($i->line_net * 100));
        $this->assertSame(2970000, $netCents, 'SUM(line_net) must equal the invoice total');
    }

    public function test_discount_cannot_make_the_total_negative(): void
    {
        $this->as($this->owner);

        $this->sell($this->payload(['discount' => ['type' => 'PERCENT', 'value' => 101]]))
            ->assertStatus(422)->assertJsonPath('code', 'INVALID_DISCOUNT');
        $this->sell($this->payload(['discount' => ['type' => 'FIXED', 'value' => 20001]]))
            ->assertStatus(422)->assertJsonPath('code', 'INVALID_DISCOUNT');
    }

    public function test_products_that_cannot_be_sold_are_rejected(): void
    {
        $this->as($this->owner);

        $priceless = $this->makeProduct($this->product->category, ['price' => null, 'name_ar' => 'بلا سعر']);
        $hidden = $this->makeProduct($this->product->category, ['status' => 'UNAVAILABLE', 'name_ar' => 'متوقف']);
        $dollars = $this->makeProduct($this->product->category, ['currency' => 'USD', 'name_ar' => 'دولار']);

        foreach ([$priceless, $hidden] as $product) {
            $this->sell($this->payload(['items' => [['product_id' => $product->id, 'quantity' => 1]]]))
                ->assertStatus(422)->assertJsonPath('code', 'PRODUCT_NOT_SELLABLE');
        }

        $this->sell($this->payload(['items' => [['product_id' => $dollars->id, 'quantity' => 1]]]))
            ->assertStatus(422)->assertJsonPath('code', 'MIXED_CURRENCY');

        $this->assertSame(0, Order::query()->count());
    }

    public function test_dine_in_needs_a_table_and_delivery_needs_an_address(): void
    {
        $this->as($this->owner);

        $this->sell($this->payload(['order_type' => 'DINE_IN']))->assertStatus(422)->assertJsonValidationErrors('table_number');
        $this->sell($this->payload(['order_type' => 'DELIVERY']))->assertStatus(422)->assertJsonValidationErrors('address');
        $this->sell($this->payload(['order_type' => 'DELIVERY', 'address' => 'شارع 1']))->assertCreated()
            ->assertJsonPath('data.order_type', 'DELIVERY');
    }

    public function test_catalog_flags_what_cannot_be_sold(): void
    {
        $this->makeProduct($this->product->category, ['price' => null, 'name_ar' => 'بلا سعر']);
        $this->makeProduct($this->product->category, ['stock_quantity' => 0, 'name_ar' => 'نفد']);

        $rows = collect($this->as($this->staff(RestaurantRole::Cashier))
            ->getJson($this->url('catalog'))->assertOk()->json('data.products'))->keyBy('name_ar');

        $this->assertTrue($rows['برغر']['sellable']);
        $this->assertSame('NO_PRICE', $rows['بلا سعر']['unsellable_reason']);
        $this->assertSame('OUT_OF_STOCK', $rows['نفد']['unsellable_reason']);
    }

    public function test_external_orders_use_the_same_ledger(): void
    {
        $this->as($this->staff(RestaurantRole::Cashier))
            ->sell($this->payload(['channel' => 'EXTERNAL', 'order_type' => 'DELIVERY', 'address' => 'x']))
            ->assertCreated()
            ->assertJsonPath('data.channel', 'EXTERNAL')
            ->assertJsonPath('data.payment_status', 'UNPAID');

        $this->getJson($this->url('orders?channel=EXTERNAL'))->assertJsonCount(1, 'data');
        $this->getJson($this->url('orders?channel=POS'))->assertJsonCount(0, 'data');
    }

    public function test_branch_pinned_members_only_see_their_branch(): void
    {
        $a = $this->branch('أ');
        $b = $this->branch('ب');
        $cashierA = $this->staff(RestaurantRole::Cashier, $a->id);

        $this->as($this->owner);
        $inB = $this->sell($this->payload(['branch_id' => $b->id]))->assertCreated()->json('data.id');
        $this->sell($this->payload(['branch_id' => $a->id]))->assertCreated();

        $this->as($cashierA);
        $this->getJson($this->url('orders'))->assertJsonCount(1, 'data');
        $this->getJson($this->url("orders/{$inB}"))->assertForbidden()->assertJsonPath('code', 'BRANCH_FORBIDDEN');
        $this->sell($this->payload(['branch_id' => $b->id]))->assertForbidden()->assertJsonPath('code', 'BRANCH_FORBIDDEN');

        // Without an explicit branch the member's own branch is used.
        $this->sell($this->payload())->assertCreated()->assertJsonPath('data.branch_id', $a->id);
    }

    public function test_other_restaurants_cannot_reach_the_ledger(): void
    {
        $id = $this->as($this->owner)->sell($this->payload())->assertCreated()->json('data.id');

        [$stranger] = $this->makeRestaurant('Other');
        $this->as($stranger);

        $this->getJson($this->url("orders/{$id}"))->assertForbidden();
        $this->getJson($this->url('orders'))->assertForbidden();
    }

    public function test_receipt_contains_what_the_customer_needs(): void
    {
        $cashier = $this->staff(RestaurantRole::Cashier);
        $id = $this->as($cashier)->sell($this->payload(['payment' => ['method' => 'CASH', 'tendered_amount' => 30000]]))
            ->json('data.id');

        $this->getJson($this->url("orders/{$id}/receipt"))
            ->assertOk()
            ->assertJsonPath('data.restaurant.name', $this->restaurant->name)
            ->assertJsonPath('data.order.number', 'S-000001')
            ->assertJsonPath('data.order.payments.0.change_amount', 10000)
            ->assertJsonPath('data.employee', $cashier->full_name);
    }
}
