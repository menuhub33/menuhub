<?php

namespace Modules\Sales\Tests;

use Modules\Orders\Models\Order;
use Modules\Shared\Enums\PosMode;
use Modules\Shared\Enums\RestaurantRole;

class KitchenTest extends SalesTestCase
{
    private function kitchenUrl(string $path = ''): string
    {
        return $this->url('kitchen/orders'.($path === '' ? '' : '/'.$path));
    }

    public function test_orders_confirmed_by_cashier_and_waiter_reach_the_kitchen(): void
    {
        $cashierOrder = $this->as($this->staff(RestaurantRole::Cashier))
            ->sell($this->payload(['payment' => ['method' => 'CASH'], 'notes' => 'بدون بصل']))
            ->assertCreated()
            ->assertJsonPath('data.kitchen_status', 'NEW')
            ->json('data.id');

        $waiterOrder = $this->as($this->staff(RestaurantRole::Waiter))
            ->sell($this->payload([
                'channel' => 'STAFF',
                'order_type' => 'DINE_IN',
                'table_number' => '7',
            ]))
            ->assertCreated()
            ->json('data.id');

        $rows = $this->as($this->staff(RestaurantRole::Kitchen))
            ->getJson($this->kitchenUrl())
            ->assertOk()
            ->json('data');

        $this->assertSame([$cashierOrder, $waiterOrder], array_column($rows, 'id')); // oldest first
        $this->assertSame('برغر', $rows[0]['items'][0]['name_ar']);
        $this->assertSame(2, $rows[0]['items'][0]['quantity']);
        $this->assertSame('7', $rows[1]['table_number']);
        $this->assertArrayNotHasKey('total', $rows[0]); // the kitchen never sees money
        $this->assertArrayNotHasKey('payments', $rows[0]);
    }

    public function test_pending_qr_orders_wait_for_confirmation_before_reaching_the_kitchen(): void
    {
        $order = Order::query()->create([
            'restaurant_id' => $this->restaurant->id,
            'number' => 'MH-QR0001',
            'status' => 'PENDING',
            'delivery_type' => 'dine_in',
            'currency' => 'SYP',
            'total' => '10000.00',
        ]);

        $this->as($this->owner)->getJson($this->kitchenUrl())->assertOk()->assertJsonCount(0, 'data');

        $order->forceFill(['status' => 'CONFIRMED', 'confirmed_at' => now()])->save();

        $this->getJson($this->kitchenUrl())->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_an_order_moves_one_step_at_a_time_and_leaves_the_screen_when_served(): void
    {
        $id = $this->as($this->owner)->sell($this->payload())->assertCreated()->json('data.id');
        $kitchen = $this->staff(RestaurantRole::Kitchen);
        $this->as($kitchen);

        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'READY'])
            ->assertStatus(422)->assertJsonPath('code', 'INVALID_TRANSITION');

        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'PREPARING'])
            ->assertOk()->assertJsonPath('data.kitchen_status', 'PREPARING');
        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'PREPARING'])->assertOk(); // idempotent

        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'READY'])->assertOk();
        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'PREPARING'])->assertOk(); // step back

        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'READY'])->assertOk();
        $this->getJson($this->kitchenUrl())->assertJsonPath('data.0.kitchen_status', 'READY');

        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'SERVED'])->assertOk();
        $this->getJson($this->kitchenUrl())->assertJsonCount(0, 'data');

        $this->assertNotNull(Order::query()->find($id)->kitchen_status_at);
    }

    public function test_cancelled_orders_disappear_and_cannot_be_moved(): void
    {
        $id = $this->as($this->owner)->sell($this->payload())->assertCreated()->json('data.id');

        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'الزبون غادر'])->assertOk();

        $this->getJson($this->kitchenUrl())->assertJsonCount(0, 'data');
        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'PREPARING'])
            ->assertStatus(422)->assertJsonPath('code', 'INVALID_TRANSITION');
    }

    public function test_permissions_per_role(): void
    {
        $id = $this->as($this->owner)->sell($this->payload())->assertCreated()->json('data.id');

        // The waiter watches the queue but cannot change it; the cashier can do both.
        $this->as($this->staff(RestaurantRole::Waiter));
        $this->getJson($this->kitchenUrl())->assertOk();
        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'PREPARING'])->assertForbidden();

        $this->as($this->staff(RestaurantRole::Cashier));
        $this->patchJson($this->kitchenUrl($id), ['kitchen_status' => 'PREPARING'])->assertOk();

        // An editor has nothing to do with the kitchen.
        $this->as($this->staff(RestaurantRole::Editor));
        $this->getJson($this->kitchenUrl())->assertForbidden();

        // A kitchen account is limited to the kitchen.
        $this->as($this->staff(RestaurantRole::Kitchen));
        $this->getJson($this->url('orders'))->assertForbidden();
        $this->postJson($this->url("orders/{$id}/cancel"), ['reason' => 'محاولة'])->assertForbidden();
    }

    public function test_kitchen_is_limited_to_the_members_branch(): void
    {
        $a = $this->branch('A');
        $b = $this->branch('B');
        $this->as($this->owner);
        $inA = $this->sell($this->payload(['branch_id' => $a->id]))->assertCreated()->json('data.id');
        $inB = $this->sell($this->payload(['branch_id' => $b->id]))->assertCreated()->json('data.id');

        $this->as($this->staff(RestaurantRole::Kitchen, $a->id));

        $this->assertSame([$inA], array_column($this->getJson($this->kitchenUrl())->json('data'), 'id'));
        $this->patchJson($this->kitchenUrl($inB), ['kitchen_status' => 'PREPARING'])
            ->assertForbidden()->assertJsonPath('code', 'BRANCH_FORBIDDEN');
    }

    public function test_kitchen_follows_the_pos_package_and_kitchen_accounts_need_it(): void
    {
        $this->posMode(PosMode::Off);

        $this->as($this->owner)->getJson($this->kitchenUrl())->assertForbidden()->assertJsonPath('code', 'POS_NOT_ENABLED');
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'kitchen@example.com', 'role' => 'KITCHEN', 'full_name' => 'Kitchen', 'password' => 'password123',
        ])->assertStatus(422)->assertJsonPath('code', 'POS_NOT_ENABLED');

        $this->posMode(PosMode::Cashier); // the kitchen does not need the waiter package
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/staff"), [
            'email' => 'kitchen@example.com', 'role' => 'KITCHEN', 'full_name' => 'Kitchen', 'password' => 'password123',
        ])->assertCreated()->assertJsonPath('data.role', 'KITCHEN');
    }
}
