<?php

namespace Modules\Catalog\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Billing\Models\Plan;
use Modules\Shared\Tests\ApiTestCase;

class CatalogTest extends ApiTestCase
{
    public function test_owner_can_create_a_product_with_options(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $category = $this->makeCategory($restaurant);
        Sanctum::actingAs($owner);

        $id = $this->postJson($this->api("restaurants/{$restaurant->id}/products"), [
            'category_id' => $category->id,
            'name_ar' => 'برغر',
            'price' => 25000,
        ])->assertCreated()->assertJsonPath('data.price', 25000)->json('data.id');

        $this->postJson($this->api("restaurants/{$restaurant->id}/products/{$id}/option-groups"), [
            'name_ar' => 'الحجم',
            'selection_type' => 'SINGLE',
            'options' => [['name_ar' => 'كبير', 'price_delta' => 5000]],
        ])->assertCreated();

        $this->getJson($this->api("restaurants/{$restaurant->id}/products/{$id}"))
            ->assertOk()->assertJsonPath('data.option_groups.0.options.0.name_ar', 'كبير');
    }

    /** The URL restaurant id must always match the resource: no cross-tenant id guessing. */
    public function test_cannot_touch_another_tenants_product_through_own_restaurant_path(): void
    {
        [$ownerA, $restaurantA] = $this->makeRestaurant('A');
        [, $restaurantB] = $this->makeRestaurant('B');
        $productB = $this->makeProduct($this->makeCategory($restaurantB));
        Sanctum::actingAs($ownerA);

        $base = "restaurants/{$restaurantA->id}/products/{$productB->id}";
        $this->getJson($this->api($base))->assertNotFound();
        $this->patchJson($this->api($base), ['name_ar' => 'hacked'])->assertNotFound();
        $this->deleteJson($this->api($base))->assertNotFound();

        $this->assertSame('منتج', $productB->refresh()->name_ar);
    }

    public function test_cannot_put_a_product_into_another_tenants_category(): void
    {
        [$ownerA, $restaurantA] = $this->makeRestaurant('A');
        [, $restaurantB] = $this->makeRestaurant('B');
        $foreignCategory = $this->makeCategory($restaurantB);
        Sanctum::actingAs($ownerA);

        $this->postJson($this->api("restaurants/{$restaurantA->id}/products"), [
            'category_id' => $foreignCategory->id, 'name_ar' => 'x', 'price' => 1,
        ])->assertStatus(422);
    }

    public function test_product_gallery_stops_at_four_images(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant));
        Sanctum::actingAs($owner);
        $path = $this->api("restaurants/{$restaurant->id}/products/{$product->id}/images");

        foreach (range(1, 4) as $index) {
            $this->postJson($path, ['image_url' => "https://cdn.example.com/p{$index}.jpg"])->assertCreated();
        }

        $this->postJson($path, ['image_url' => 'https://cdn.example.com/p5.jpg'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'PRODUCT_IMAGE_LIMIT');
    }

    public function test_plan_product_limit_is_enforced(): void
    {
        Plan::query()->where('slug', 'free')->update(['max_products' => 2]);
        [$owner, $restaurant] = $this->makeRestaurant();
        $category = $this->makeCategory($restaurant);
        Sanctum::actingAs($owner);

        $payload = ['category_id' => $category->id, 'name_ar' => 'x', 'price' => 1];
        $path = $this->api("restaurants/{$restaurant->id}/products");

        $this->postJson($path, $payload)->assertCreated();
        $this->postJson($path, $payload)->assertCreated();
        $this->postJson($path, $payload)->assertForbidden()->assertJsonPath('code', 'PLAN_LIMIT_REACHED');
    }

    public function test_plan_category_and_image_caps_are_enforced(): void
    {
        Plan::query()->where('slug', 'free')->update([
            'max_categories' => 1,
            'max_product_images' => 1,
        ]);
        [$owner, $restaurant] = $this->makeRestaurant();
        Sanctum::actingAs($owner);
        $menuId = $this->defaultMenu($restaurant)->id;

        $this->postJson($this->api("restaurants/{$restaurant->id}/categories"), [
            'menu_id' => $menuId,
            'name_ar' => 'مشاوي',
        ])->assertCreated();

        $this->postJson($this->api("restaurants/{$restaurant->id}/categories"), [
            'menu_id' => $menuId,
            'name_ar' => 'حلويات',
        ])->assertForbidden()->assertJsonPath('code', 'PLAN_LIMIT_REACHED');

        $product = $this->makeProduct($this->makeCategory($restaurant));
        $path = $this->api("restaurants/{$restaurant->id}/products/{$product->id}/images");
        $this->postJson($path, ['image_url' => 'https://cdn.example.com/a.jpg'])->assertCreated();
        $this->postJson($path, ['image_url' => 'https://cdn.example.com/b.jpg'])
            ->assertStatus(422)
            ->assertJsonPath('code', 'PRODUCT_IMAGE_LIMIT');
    }

    public function test_product_can_be_featured_and_discounted(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $category = $this->makeCategory($restaurant);
        Sanctum::actingAs($owner);
        $path = $this->api("restaurants/{$restaurant->id}/products");

        $id = $this->postJson($path, [
            'category_id' => $category->id,
            'name_ar' => 'فتوش',
            'price' => 16000,
            'old_price' => 20000,
            'is_featured' => true,
        ])->assertCreated()
            ->assertJsonPath('data.is_featured', true)
            ->assertJsonPath('data.old_price', 20000)
            ->json('data.id');

        $this->getJson($path.'?featured=1&discounted=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $id);

        $this->postJson($path, [
            'category_id' => $category->id,
            'name_ar' => 'حسم غير صالح',
            'price' => 100,
            'old_price' => 80,
        ])->assertStatus(422);
    }

    public function test_publish_and_unpublish_default_menu_syncs_restaurant_state(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $menu = $this->defaultMenu($restaurant);
        Sanctum::actingAs($owner);

        $this->postJson($this->api("restaurants/{$restaurant->id}/menus/{$menu->id}/unpublish"))->assertOk();
        $this->assertSame('UNPUBLISHED', $restaurant->refresh()->menu_status->value);

        $this->postJson($this->api("restaurants/{$restaurant->id}/menus/{$menu->id}/publish"))->assertOk();
        $this->assertSame('PUBLISHED', $restaurant->refresh()->menu_status->value);
    }
}
