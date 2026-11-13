<?php

namespace Modules\Sales\Tests;

use Illuminate\Support\Facades\DB;
use Modules\Operations\Models\Branch;
use Modules\Orders\Models\Order;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Tenancy\Support\Permissions;

/**
 * The sales ledger must not change anything for the existing QR flow (spec §1).
 */
class SalesCompatibilityTest extends SalesTestCase
{
    private function placeQrOrder(): string
    {
        return $this->postJson($this->api("public/menus/{$this->restaurant->slug}/orders"), [
            'delivery_type' => 'dine_in',
            'table_number' => '3',
            'items' => [['product_id' => $this->product->id, 'quantity' => 1]],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->json('data.id');
    }

    public function test_public_qr_orders_keep_their_contract_and_defaults(): void
    {
        $id = $this->placeQrOrder();
        $order = Order::query()->findOrFail($id);

        $this->assertSame('QR', $order->channel->value);
        $this->assertSame('PENDING', $order->status->value);
        $this->assertSame('UNPAID', $order->payment_status->value);
        $this->assertFalse($order->is_legacy);
        $this->assertStringStartsWith('MH-', $order->number);
        $this->assertSame(10, $this->product->refresh()->stock_quantity, 'stock only drops on confirmation');
    }

    public function test_legacy_orders_inbox_only_lists_qr_orders(): void
    {
        $qr = $this->placeQrOrder();
        $this->as($this->owner)->sell($this->payload())->assertCreated();

        $inbox = $this->getJson($this->api("restaurants/{$this->restaurant->id}/orders?status=PENDING"))->assertOk();
        $this->assertSame([$qr], collect($inbox->json('data'))->pluck('id')->all());

        // The confirmed tab of the QR inbox does not show POS sales either.
        $this->getJson($this->api("restaurants/{$this->restaurant->id}/orders?status=CONFIRMED"))
            ->assertOk()->assertJsonCount(0, 'data');

        $this->getJson($this->api("restaurants/{$this->restaurant->id}/orders?status=PENDING"))
            ->assertJsonPath('data.0.fulfillment_status', 'OPEN')
            ->assertJsonPath('data.0.channel', 'QR');
    }

    public function test_the_legacy_endpoints_cannot_touch_pos_sales(): void
    {
        $this->as($this->owner);
        $sale = $this->sell($this->payload())->assertCreated()->json('data.id');

        // POS sales are born CONFIRMED, so the legacy confirm / reject refuse them.
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/orders/{$sale}/confirm"))->assertStatus(422);
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/orders/{$sale}/reject"))->assertStatus(422);
        $this->assertSame(8, $this->product->refresh()->stock_quantity);
    }

    public function test_qr_orders_still_work_when_the_restaurant_has_no_pos(): void
    {
        $this->posMode(\Modules\Shared\Enums\PosMode::Off);
        $id = $this->placeQrOrder();

        $this->as($this->owner)
            ->postJson($this->api("restaurants/{$this->restaurant->id}/orders/{$id}/confirm"))
            ->assertOk()->assertJsonPath('data.status', 'CONFIRMED');
    }

    public function test_existing_orders_are_backfilled_as_legacy_without_assuming_payment(): void
    {
        // Simulate a row written before the migration: columns are defaulted by the migration backfill.
        $id = $this->placeQrOrder();
        $this->as($this->owner)->postJson($this->api("restaurants/{$this->restaurant->id}/orders/{$id}/confirm"))->assertOk();

        DB::table('orders')->where('id', $id)->update(['is_legacy' => false, 'subtotal' => 0, 'inventory_deducted_at' => null]);

        $migration = require base_path('modules/Orders/Database/Migrations/2026_11_12_000100_add_sales_ledger_to_orders.php');
        $method = new \ReflectionMethod($migration, 'backfill');
        $method->invoke($migration);

        $order = Order::query()->findOrFail($id);
        $this->assertTrue($order->is_legacy);
        $this->assertSame('UNPAID', $order->payment_status->value, 'a confirmed legacy order is never assumed paid');
        $this->assertSame('QR', $order->channel->value);
        $this->assertEquals($order->total, $order->subtotal);
        $this->assertNotNull($order->inventory_deducted_at, 'old confirmations already took stock out');

        // Running it twice changes nothing.
        $method->invoke($migration);
        $this->assertSame(1, Order::query()->where('is_legacy', true)->count());
    }

    public function test_legacy_orders_do_not_count_as_receivables(): void
    {
        $id = $this->placeQrOrder();
        $this->as($this->owner)->postJson($this->api("restaurants/{$this->restaurant->id}/orders/{$id}/confirm"))->assertOk();
        Order::query()->whereKey($id)->update(['is_legacy' => true]);

        $this->getJson($this->url('orders/unpaid'))->assertOk()->assertJsonCount(0, 'data');
        // ...but they are still in the ledger, flagged.
        $this->getJson($this->url('orders'))->assertJsonPath('data.0.is_legacy', true);
        $this->getJson($this->url('orders?include_legacy=0'))->assertJsonCount(0, 'data');
    }

    public function test_new_roles_can_be_assigned_through_the_staff_api(): void
    {
        $this->as($this->owner);
        $branch = $this->branch();

        $this->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'cashier@example.com',
            'role' => 'CASHIER',
            'full_name' => 'كاشير',
            'password' => 'password123',
            'branch_id' => $branch->id,
        ])->assertCreated()
            ->assertJsonPath('data.role', 'CASHIER')
            ->assertJsonPath('data.branch_id', $branch->id);

        $this->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'waiter@example.com', 'role' => 'WAITER', 'full_name' => 'نادل', 'password' => 'password123',
        ])->assertCreated()->assertJsonPath('data.role', 'WAITER');

        // A branch of another restaurant is refused.
        [, $other] = $this->makeRestaurant('Elsewhere');
        $foreign = Branch::query()->create(['restaurant_id' => $other->id, 'name' => 'x', 'slug' => 'x-1']);
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'c2@example.com', 'role' => 'CASHIER', 'full_name' => 'c', 'password' => 'password123', 'branch_id' => $foreign->id,
        ])->assertStatus(422)->assertJsonValidationErrors('branch_id');
    }

    public function test_the_permission_matrix_matches_the_spec(): void
    {
        $matrix = [
            'pos.use' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 1, 'WAITER' => 0, 'EDITOR' => 0],
            'sales.collect' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 1, 'WAITER' => 0, 'EDITOR' => 0],
            'sales.create_staff' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 1, 'WAITER' => 1, 'EDITOR' => 0],
            'sales.discount' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 0, 'WAITER' => 0, 'EDITOR' => 0],
            'sales.cancel' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 0, 'WAITER' => 0, 'EDITOR' => 0],
            'sales.refund' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 0, 'WAITER' => 0, 'EDITOR' => 0],
            'reports.sales' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 0, 'WAITER' => 0, 'EDITOR' => 0],
            'reports.own' => ['OWNER' => 1, 'MANAGER' => 1, 'CASHIER' => 1, 'WAITER' => 0, 'EDITOR' => 0],
        ];

        foreach ($matrix as $permission => $roles) {
            foreach ($roles as $role => $allowed) {
                $this->assertSame(
                    (bool) $allowed,
                    Permissions::allows(RestaurantRole::from($role), $permission),
                    "{$role} / {$permission}",
                );
            }
        }
    }
}
