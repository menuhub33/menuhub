<?php

namespace Modules\Tenancy\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Tenancy\Models\Mall;
use Modules\Tenancy\Models\Restaurant;
use Modules\Users\Models\User;

class MallTest extends ApiTestCase
{
    public function test_platform_admin_creates_a_mall_and_its_manager(): void
    {
        $this->actingAdmin();

        $id = $this->postJson($this->api('admin/malls'), [
            'name' => 'City Mall',
            'manager' => [
                'full_name' => 'Mall Manager',
                'email' => 'mall@example.com',
                'password' => 'password123',
            ],
        ])->assertCreated()
            ->assertJsonPath('data.status', 'UNPUBLISHED')
            ->assertJsonPath('data.slug', 'city-mall')
            ->assertJsonPath('data.manager.email', 'mall@example.com')
            ->json('data.id');

        $this->assertNotNull(Mall::query()->find($id));
    }

    public function test_mall_manager_can_only_provision_stores_inside_the_mall(): void
    {
        $this->actingAdmin();
        $mallId = $this->postJson($this->api('admin/malls'), [
            'name' => 'City Mall',
            'slug' => 'city-mall',
            'manager' => [
                'full_name' => 'Mall Manager',
                'email' => 'mall@example.com',
                'password' => 'password123',
            ],
        ])->json('data.id');

        $manager = User::query()->where('email', 'mall@example.com')->firstOrFail();
        Sanctum::actingAs($manager);

        $this->postJson($this->api('admin/malls'), ['name' => 'Other'])->assertForbidden();

        $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Private Shop',
            'email' => 'private@example.com',
            'password' => 'password123',
            'mall_id' => null,
            'pos_mode' => 'CASHIER', // a mall manager cannot grant the POS package
        ])->assertCreated()->assertJsonPath('data.mall_id', $mallId)->assertJsonPath('data.pos_mode', 'OFF');

        $this->getJson($this->api('admin/restaurants'))
            ->assertOk()
            ->assertJsonPath('data.0.mall_id', $mallId);

        [, $outside] = $this->makeRestaurant('Outside');
        $this->getJson($this->api("admin/restaurants/{$outside->id}"))->assertNotFound();
        $this->getJson($this->api('admin/malls'))->assertForbidden();
        $this->getJson($this->api('admin/settings'))->assertForbidden();
    }

    public function test_platform_admin_can_create_a_private_menu_or_attach_one_to_a_mall(): void
    {
        $this->actingAdmin();
        $mallId = $this->postJson($this->api('admin/malls'), ['name' => 'City Mall', 'slug' => 'city-mall'])
            ->assertCreated()->json('data.id');

        $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Solo Shop',
            'email' => 'solo@example.com',
            'password' => 'password123',
        ])->assertCreated()->assertJsonPath('data.mall_id', null);

        $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Mall Shop',
            'email' => 'inside@example.com',
            'password' => 'password123',
            'mall_id' => $mallId,
        ])->assertCreated()->assertJsonPath('data.mall_id', $mallId);
    }

    public function test_public_directory_lists_only_published_stores_of_a_published_mall(): void
    {
        $this->actingAdmin();
        $mallId = $this->postJson($this->api('admin/malls'), ['name' => 'City Mall', 'slug' => 'city-mall'])
            ->json('data.id');

        $this->getJson($this->api('public/malls/city-mall'))
            ->assertOk()->assertJsonPath('data.reason', 'UNPUBLISHED');

        $this->patchJson($this->api("admin/malls/{$mallId}"), ['status' => 'PUBLISHED'])->assertOk();

        $storeId = $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Mall Cafe',
            'email' => 'cafe@example.com',
            'password' => 'password123',
            'business_type' => 'CAFE',
            'mall_id' => $mallId,
        ])->json('data.id');

        $this->putJson($this->api("admin/restaurants/{$storeId}/status"), ['status' => 'ACTIVE'])->assertOk();

        $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Hidden Draft',
            'email' => 'draft@example.com',
            'password' => 'password123',
            'mall_id' => $mallId,
        ])->assertCreated();

        $this->getJson($this->api('public/malls/city-mall'))
            ->assertOk()
            ->assertJsonPath('data.kind', 'live')
            ->assertJsonCount(1, 'data.stores')
            ->assertJsonPath('data.stores.0.name', 'Mall Cafe')
            ->assertJsonPath('data.stores.0.business_type', 'CAFE');

        $this->assertSame($mallId, Restaurant::query()->find($storeId)->mall_id);
        $this->assertSame(RestaurantStatus::Active, Restaurant::query()->find($storeId)->status);
    }

    public function test_mall_manager_can_open_a_store_dashboard(): void
    {
        $this->actingAdmin();
        $mallId = $this->postJson($this->api('admin/malls'), [
            'name' => 'City Mall',
            'slug' => 'city-mall',
            'manager' => [
                'full_name' => 'Mall Manager',
                'email' => 'mall@example.com',
                'password' => 'password123',
            ],
        ])->json('data.id');

        $manager = User::query()->where('email', 'mall@example.com')->firstOrFail();
        Sanctum::actingAs($manager);

        $storeId = $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Mall Cafe',
            'email' => 'cafe@example.com',
            'password' => 'password123',
            'mall_id' => $mallId,
        ])->json('data.id');

        $this->putJson($this->api("admin/restaurants/{$storeId}/status"), ['status' => 'ACTIVE'])->assertOk();

        $this->getJson($this->api('me/restaurants'))
            ->assertOk()
            ->assertJsonPath('data.0.restaurant.id', $storeId);

        $this->getJson($this->api("restaurants/{$storeId}"))
            ->assertOk()
            ->assertJsonPath('data.restaurant.mall_id', $mallId);
    }

    public function test_mall_manager_customizes_the_directory_like_a_menu(): void
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

        $manager = User::query()->where('email', 'mall@example.com')->firstOrFail();
        Sanctum::actingAs($manager);

        $css = $this->patchJson($this->api('admin/mall/theme'), [
            'primary_color' => '#112233',
            'font_family' => 'Expo Arabic',
            'custom_css' => '</style><script>alert(1)</script> .mh-mall { color: red; }',
        ])->assertOk()
            ->assertJsonPath('data.primary_color', '#112233')
            ->json('data.custom_css');

        $this->assertStringNotContainsString('<', (string) $css);
        $this->assertStringContainsString('color: red', (string) $css);

        $this->patchJson($this->api('admin/mall'), ['status' => 'PUBLISHED'])->assertOk();

        $this->getJson($this->api('public/malls/city-mall'))
            ->assertOk()
            ->assertJsonPath('data.theme.primary_color', '#112233')
            ->assertJsonPath('data.theme.font_family', 'Expo Arabic');
    }

    public function test_a_mall_slug_cannot_collide_with_a_store_slug(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant('Taken');

        $this->postJson($this->api('admin/malls'), [
            'name' => 'Taken',
            'slug' => $restaurant->slug,
        ])->assertCreated()->assertJsonPath('data.slug', $restaurant->slug.'-2');
    }
}
