<?php

namespace Modules\Tenancy\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Tests\ApiTestCase;

class TenancyTest extends ApiTestCase
{
    public function test_owner_sees_own_restaurant_with_permissions_and_plan(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $this->getJson($this->api("restaurants/{$restaurant->id}"))
            ->assertOk()
            ->assertJsonPath('data.role', 'OWNER')
            ->assertJsonPath('data.plan.plan.slug', 'free');

        $this->getJson($this->api('me/restaurants'))->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_user_cannot_access_a_restaurant_they_do_not_belong_to(): void
    {
        [$ownerA] = $this->makeRestaurant('A');
        [, $restaurantB] = $this->makeRestaurant('B');
        Sanctum::actingAs($ownerA);

        $this->getJson($this->api("restaurants/{$restaurantB->id}"))->assertForbidden();
        $this->getJson($this->api("restaurants/{$restaurantB->id}/products"))->assertForbidden();
    }

    public function test_editor_has_limited_permissions(): void
    {
        [, $restaurant] = $this->makeRestaurant();
        $editor = $this->addStaff($restaurant, RestaurantRole::Editor);
        $category = $this->makeCategory($restaurant);
        $product = $this->makeProduct($category);
        Sanctum::actingAs($editor);

        $this->getJson($this->api("restaurants/{$restaurant->id}/products"))->assertOk();
        $this->deleteJson($this->api("restaurants/{$restaurant->id}/products/{$product->id}"))->assertForbidden();
        $this->postJson($this->api("restaurants/{$restaurant->id}/staff"), [
            'email' => 'new@example.com', 'full_name' => 'New', 'role' => 'MANAGER',
        ])->assertForbidden();
        $this->getJson($this->api("restaurants/{$restaurant->id}/audit-logs"))->assertForbidden();
    }

    public function test_dashboard_update_cannot_change_status_or_business_type(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $this->patchJson($this->api("restaurants/{$restaurant->id}"), [
            'name' => 'New name',
            'status' => 'CANCELLED',
            'business_type' => 'SHOP',
            'menu_status' => 'DRAFT',
        ])->assertOk();

        $restaurant->refresh();
        $this->assertSame('New name', $restaurant->name);
        $this->assertSame('ACTIVE', $restaurant->status->value);
        $this->assertSame('RESTAURANT', $restaurant->business_type->value);
        $this->assertSame('PUBLISHED', $restaurant->menu_status->value);
    }

    public function test_reserved_and_taken_slugs_are_refused(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        [, $other] = $this->makeRestaurant('Other');
        Sanctum::actingAs($owner);

        $this->patchJson($this->api("restaurants/{$restaurant->id}"), ['slug' => 'admin'])->assertStatus(422);
        $this->patchJson($this->api("restaurants/{$restaurant->id}"), ['slug' => $other->slug])->assertStatus(422);
        $this->patchJson($this->api("restaurants/{$restaurant->id}"), ['slug' => 'fresh-slug'])->assertOk();
    }

    public function test_suspended_restaurant_is_read_only_for_staff(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant(activate: false);
        Sanctum::actingAs($owner);
        $category = $this->makeCategory($restaurant);

        $this->postJson($this->api("restaurants/{$restaurant->id}/products"), [
            'category_id' => $category->id, 'name_ar' => 'x', 'price' => 5,
        ])->assertForbidden();
    }
}
