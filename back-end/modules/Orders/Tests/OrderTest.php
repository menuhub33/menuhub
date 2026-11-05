<?php

namespace Modules\Orders\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Catalog\Models\Product;
use Modules\Orders\Models\Order;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Users\Models\User;

class OrderTest extends ApiTestCase
{
    public function test_placing_an_order_waits_for_confirmation_before_stock_drops(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant), ['stock_quantity' => 3, 'name_ar' => 'برغر']);

        $first = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'PENDING')
            ->json('data.id');

        $second = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertCreated()->json('data.id');

        $this->assertSame(3, $product->refresh()->stock_quantity);

        Sanctum::actingAs($owner);
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$first}/confirm"))
            ->assertOk()
            ->assertJsonPath('data.status', 'CONFIRMED');
        $this->assertSame(1, $product->refresh()->stock_quantity);
        $this->assertSame('AVAILABLE', $product->status->value);

        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$second}/confirm"))
            ->assertStatus(422);
        $this->assertSame(1, $product->refresh()->stock_quantity);
        $this->assertSame('PENDING', Order::query()->findOrFail($second)->status->value);
    }

    public function test_rejecting_an_order_keeps_stock(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant), ['stock_quantity' => 4]);
        $id = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'dine_in',
            'table_number' => '4',
            'items' => [['product_id' => $product->id, 'quantity' => 1, 'extra' => 1500]],
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($owner);
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$id}/reject"))
            ->assertOk()
            ->assertJsonPath('data.status', 'REJECTED')
            ->assertJsonPath('data.items.0.extra', 1500);
        $this->assertSame(4, $product->refresh()->stock_quantity);
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$id}/confirm"))->assertStatus(422);
    }

    public function test_untracked_stock_is_left_unchanged_on_confirm(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant));
        $id = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 6]],
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($owner);
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$id}/confirm"))->assertOk();
        $this->assertNull($product->refresh()->stock_quantity);
    }

    public function test_public_order_cannot_exceed_remaining_stock(): void
    {
        [, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant), ['stock_quantity' => 1, 'name_ar' => 'عصير']);

        $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
        ])->assertStatus(422);

        $this->assertSame(1, $product->refresh()->stock_quantity);
        $this->assertSame(0, Order::query()->count());
    }

    public function test_each_section_loads_only_its_own_orders(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant), ['stock_quantity' => 5]);

        $pending = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');

        $confirmed = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');

        $rejected = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($owner);
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$confirmed}/confirm"))->assertOk();
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$rejected}/reject"))->assertOk();

        $this->getJson($this->api("restaurants/{$restaurant->id}/orders"))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $pending)
            ->assertJsonPath('data.0.status', 'PENDING');

        $this->getJson($this->api("restaurants/{$restaurant->id}/orders?status=CONFIRMED"))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $confirmed);

        $this->getJson($this->api("restaurants/{$restaurant->id}/orders?status=REJECTED"))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $rejected);
    }

    public function test_editor_cannot_manage_orders_and_orders_stay_inside_the_tenant(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant('A');
        [$otherOwner, $other] = $this->makeRestaurant('B');
        $product = $this->makeProduct($this->makeCategory($restaurant), ['stock_quantity' => 2]);
        $id = $this->postJson($this->api("public/menus/{$restaurant->slug}/orders"), [
            'delivery_type' => 'pickup',
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.id');

        $editor = $this->addStaff($restaurant, RestaurantRole::Editor);
        Sanctum::actingAs($editor);
        $this->getJson($this->api("restaurants/{$restaurant->id}/orders"))->assertForbidden();
        $this->postJson($this->api("restaurants/{$restaurant->id}/orders/{$id}/confirm"))->assertForbidden();

        Sanctum::actingAs($otherOwner);
        $this->getJson($this->api("restaurants/{$other->id}/orders/{$id}"))->assertNotFound();

        Sanctum::actingAs($owner);
        $this->getJson($this->api("restaurants/{$restaurant->id}/orders?status=PENDING"))
            ->assertOk()
            ->assertJsonPath('data.0.id', $id);
    }

    public function test_product_stock_can_be_saved_and_zero_is_returned_to_the_menu(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $category = $this->makeCategory($restaurant);
        Sanctum::actingAs($owner);

        $id = $this->postJson($this->api("restaurants/{$restaurant->id}/products"), [
            'category_id' => $category->id,
            'name_ar' => 'كنافة',
            'price' => 8000,
            'stock_quantity' => 0,
        ])->assertCreated()->assertJsonPath('data.stock_quantity', 0)->json('data.id');

        $this->assertSame(0, Product::query()->findOrFail($id)->stock_quantity);

        $this->getJson($this->api("public/menus/{$restaurant->slug}"))
            ->assertOk()
            ->assertJsonPath('data.data.categories.0.products.0.stock_quantity', 0)
            ->assertJsonPath('data.data.categories.0.products.0.status', 'AVAILABLE');
    }

    public function test_a_customer_can_report_a_product_problem(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();

        $this->postJson($this->api("public/menus/{$restaurant->slug}/complaints"), [
            'product_name' => '  برغر  ',
            'description' => '  وصل بارد وناقص  ',
        ])->assertCreated()
            ->assertJsonPath('data.product_name', 'برغر')
            ->assertJsonPath('data.description', 'وصل بارد وناقص');

        $this->postJson($this->api("public/menus/{$restaurant->slug}/complaints"), [
            'product_name' => '',
            'description' => 'ناقص',
        ])->assertStatus(422);

        $this->postJson($this->api('public/menus/missing-menu/complaints'), [
            'product_name' => 'شاي',
            'description' => 'ما وصل',
        ])->assertNotFound();

        Sanctum::actingAs($owner);
        $this->getJson($this->api("restaurants/{$restaurant->id}/complaints"))
            ->assertOk()
            ->assertJsonPath('data.0.product_name', 'برغر')
            ->assertJsonPath('data.0.description', 'وصل بارد وناقص');
    }

    public function test_a_mall_manager_sees_complaints_only_from_their_stores(): void
    {
        $this->actingAdmin();
        $this->postJson($this->api('admin/malls'), [
            'name' => 'City Mall',
            'slug' => 'city-mall',
            'manager' => [
                'full_name' => 'Mall Manager',
                'email' => 'mall-orders@example.com',
                'password' => 'password123',
            ],
        ])->assertCreated();
        $this->postJson($this->api('admin/malls'), [
            'name' => 'Other Mall',
            'slug' => 'other-mall',
            'manager' => [
                'full_name' => 'Other Manager',
                'email' => 'other-orders@example.com',
                'password' => 'password123',
            ],
        ])->assertCreated();

        $manager = User::query()->where('email', 'mall-orders@example.com')->firstOrFail();
        Sanctum::actingAs($manager);
        $store = $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Mall Cafe',
            'email' => 'cafe-orders@example.com',
            'password' => 'password123',
        ])->assertCreated()->json('data');
        $this->putJson($this->api("admin/restaurants/{$store['id']}/status"), ['status' => 'ACTIVE'])->assertOk();

        $this->postJson($this->api("public/menus/{$store['slug']}/complaints"), [
            'product_name' => 'صحن',
            'description' => 'الصحن مكسور',
        ])->assertCreated();

        $this->getJson($this->api('admin/order-complaints'))
            ->assertOk()
            ->assertJsonPath('data.0.product_name', 'صحن')
            ->assertJsonPath('data.0.description', 'الصحن مكسور')
            ->assertJsonPath('data.0.restaurant.name', 'Mall Cafe');

        Sanctum::actingAs(User::query()->where('email', 'other-orders@example.com')->firstOrFail());
        $this->getJson($this->api('admin/order-complaints'))
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }
}
