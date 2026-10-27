<?php

namespace Modules\Storefront\Tests;

use Modules\Platform\Services\RestaurantAdminService;
use Modules\Shared\Enums\ProductStatus;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Tests\ApiTestCase;

class StorefrontTest extends ApiTestCase
{
    public function test_unknown_slug_is_not_found_state(): void
    {
        $this->getJson($this->api('public/menus/nope'))
            ->assertOk()->assertJsonPath('data.kind', 'unavailable')->assertJsonPath('data.reason', 'NOT_FOUND');
    }

    public function test_draft_restaurant_is_unavailable_and_active_one_is_live(): void
    {
        [, $restaurant] = $this->makeRestaurant(activate: false);

        $this->getJson($this->api("public/menus/{$restaurant->slug}"))
            ->assertJsonPath('data.reason', 'SUSPENDED');

        app(RestaurantAdminService::class)->setStatus($restaurant, RestaurantStatus::Active);

        $this->getJson($this->api("public/menus/{$restaurant->slug}"))
            ->assertOk()->assertJsonPath('data.kind', 'live')
            ->assertJsonPath('data.data.restaurant.slug', $restaurant->slug);
    }

    public function test_expired_restaurant_shows_reason(): void
    {
        [, $restaurant] = $this->makeRestaurant();
        app(RestaurantAdminService::class)->setStatus($restaurant, RestaurantStatus::Expired);

        $this->getJson($this->api("public/menus/{$restaurant->slug}"))
            ->assertJsonPath('data.reason', 'EXPIRED');
    }

    public function test_hidden_products_and_inactive_categories_are_not_exposed(): void
    {
        [, $restaurant] = $this->makeRestaurant();
        $category = $this->makeCategory($restaurant, 'ظاهر');
        $this->makeProduct($category, ['name_ar' => 'متاح']);
        $this->makeProduct($category, ['name_ar' => 'مخفي', 'status' => ProductStatus::Hidden]);
        $hiddenCategory = $this->makeCategory($restaurant, 'معطّل');
        $hiddenCategory->update(['is_active' => false]);

        $response = $this->getJson($this->api("public/menus/{$restaurant->slug}"))->assertOk();

        $categories = $response->json('data.data.categories');
        $this->assertCount(1, $categories);
        $this->assertCount(1, $categories[0]['products']);
        $this->assertSame('متاح', $categories[0]['products'][0]['name_ar']);
    }

    public function test_cache_is_invalidated_when_content_changes(): void
    {
        [, $restaurant] = $this->makeRestaurant();
        $category = $this->makeCategory($restaurant);
        $product = $this->makeProduct($category, ['name_ar' => 'قديم']);
        $path = $this->api("public/menus/{$restaurant->slug}");

        $this->getJson($path)->assertJsonPath('data.data.categories.0.products.0.name_ar', 'قديم');

        $product->update(['name_ar' => 'جديد']);

        $this->getJson($path)->assertJsonPath('data.data.categories.0.products.0.name_ar', 'جديد');
    }

    public function test_demo_catalogs_are_served_from_the_database(): void
    {
        $this->artisan('menuhub:seed-demo')->assertSuccessful();

        $this->getJson($this->api('public/menus/demo'))
            ->assertOk()->assertJsonPath('data.kind', 'live')
            ->assertJsonCount(5, 'data.data.categories')
            ->assertJsonPath('data.data.businessHours.0.day_of_week', 0);

        $this->getJson($this->api('public/menus/demo-cars'))->assertJsonPath('data.kind', 'live');
    }
}
