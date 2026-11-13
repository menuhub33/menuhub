<?php

namespace Modules\Platform\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Billing\Models\Plan;
use Modules\Notifications\Models\Notification;
use Modules\Shared\Enums\PlatformRole;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Tenancy\Models\Restaurant;

class PlatformTest extends ApiTestCase
{
    public function test_regular_users_cannot_reach_admin_endpoints(): void
    {
        Sanctum::actingAs($this->makeUser());

        foreach (['admin/restaurants', 'admin/stats', 'admin/users', 'admin/settings', 'admin/finance'] as $path) {
            $this->getJson($this->api($path))->assertForbidden();
        }
    }

    public function test_admin_provisions_a_complete_restaurant(): void
    {
        $this->actingAdmin();

        $id = $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Cafe Nova',
            'email' => 'owner@nova.test',
            'password' => 'password123',
            'business_type' => 'CAFE',
            'pos_mode' => 'CASHIER_WAITER',
            'billing' => [
                'price' => 500, 'discount_type' => 'NONE', 'starts_on' => '2026-01-01', 'currency' => 'USD',
            ],
        ])->assertCreated()
            ->assertJsonPath('data.pos_mode', 'CASHIER_WAITER')
            ->assertJsonPath('data.status', 'SUSPENDED')
            ->assertJsonPath('data.menu_status', 'DRAFT')
            ->assertJsonPath('data.business_type', 'CAFE')
            ->assertJsonPath('data.currency', 'USD')
            ->json('data.id');

        $restaurant = Restaurant::query()->findOrFail($id);
        $this->assertSame('cafe-nova', $restaurant->slug);
        $this->assertSame('owner@nova.test', $restaurant->owner()->email);

        $this->getJson($this->api("admin/restaurants/{$id}"))->assertOk()
            ->assertJsonPath('data.billing.price', 500)
            ->assertJsonCount(1, 'data.staff');

        $this->getJson($this->api("restaurants/{$id}/subscription"))->assertOk()
            ->assertJsonPath('data.subscription.status', 'TRIAL')
            ->assertJsonPath('data.subscription.plan.slug', 'free');
    }

    public function test_duplicate_owner_email_is_rejected_and_nothing_is_left_behind(): void
    {
        $this->actingAdmin();
        $this->makeUser(email: 'taken@example.com');
        $before = Restaurant::query()->count();

        $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Dup', 'email' => 'taken@example.com', 'password' => 'password123',
        ])->assertStatus(422);

        $this->assertSame($before, Restaurant::query()->count());
    }

    public function test_admin_can_update_owner_email_and_password(): void
    {
        $this->actingAdmin();

        $id = $this->postJson($this->api('admin/restaurants'), [
            'name' => 'Cafe Nova',
            'email' => 'owner@nova.test',
            'password' => 'password123',
            'billing' => [
                'price' => 500, 'discount_type' => 'NONE', 'starts_on' => '2026-01-01', 'currency' => 'USD',
            ],
        ])->assertCreated()->json('data.id');

        $this->getJson($this->api('admin/restaurants'))
            ->assertOk()
            ->assertJsonFragment(['owner_password' => 'password123']);

        $this->patchJson($this->api("admin/restaurants/{$id}"), [
            'owner_email' => 'new-owner@nova.test',
            'owner_password' => 'new-password',
        ])->assertOk();

        $this->postJson($this->api('auth/login'), [
            'email' => 'new-owner@nova.test',
            'password' => 'new-password',
        ])->assertOk();

        $this->postJson($this->api('auth/login'), [
            'email' => 'owner@nova.test',
            'password' => 'password123',
        ])->assertStatus(401);
    }

    public function test_activating_publishes_and_notifies_the_owner(): void
    {
        $this->actingAdmin();
        [$owner, $restaurant] = $this->makeRestaurant(activate: false);

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/status"), ['status' => 'ACTIVE'])
            ->assertOk()->assertJsonPath('data.menu_status', 'PUBLISHED');

        $this->assertSame('PUBLISHED', $this->defaultMenu($restaurant)->status->value);
        $this->assertTrue(Notification::query()->where('user_id', $owner->id)->exists());

        $this->getJson($this->api("public/menus/{$restaurant->slug}"))->assertJsonPath('data.kind', 'live');
    }

    public function test_plan_change_updates_limits(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();
        $business = Plan::query()->where('slug', 'business')->firstOrFail();

        $this->putJson($this->api("admin/restaurants/{$restaurant->id}/plan"), ['plan_id' => $business->id])
            ->assertOk()->assertJsonPath('data.status', 'ACTIVE');

        $this->getJson($this->api("restaurants/{$restaurant->id}"))
            ->assertJsonPath('data.plan.plan.slug', 'business')
            ->assertJsonPath('data.plan.features.custom_domain', true);
    }

    public function test_admin_can_create_a_plan_without_a_slug(): void
    {
        $this->actingAdmin();

        $created = $this->postJson($this->api('admin/plans'), [
            'name' => 'ذهبية',
            'price_monthly' => 40,
            'price_yearly' => 400,
            'max_products' => 50,
            'max_categories' => 8,
        ])->assertCreated()
            ->assertJsonPath('data.name', 'ذهبية')
            ->assertJsonPath('data.price_yearly', 400)
            ->assertJsonPath('data.max_products', 50)
            ->assertJsonPath('data.max_categories', 8)
            ->assertJsonPath('data.is_active', true);

        $this->assertMatchesRegularExpression('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', (string) $created->json('data.slug'));

        $this->postJson($this->api('admin/plans'), [
            'name' => 'فضية',
            'slug' => 'silver',
            'price_monthly' => 15,
            'price_yearly' => 150,
        ])->assertCreated()->assertJsonPath('data.slug', 'silver');
    }

    public function test_admin_can_delete_only_an_unused_non_free_plan(): void
    {
        $this->actingAdmin();
        [, $restaurant] = $this->makeRestaurant();

        $spare = $this->postJson($this->api('admin/plans'), [
            'name' => 'مؤقتة',
            'price_monthly' => 1,
            'price_yearly' => 10,
        ])->assertCreated()->json('data.id');

        $this->deleteJson($this->api("admin/plans/{$spare}"))->assertNoContent();
        $this->assertDatabaseMissing('plans', ['id' => $spare]);

        $free = \Modules\Billing\Models\Plan::query()->where('slug', 'free')->firstOrFail();
        $this->deleteJson($this->api("admin/plans/{$free->id}"))->assertStatus(422);

        $pro = \Modules\Billing\Models\Plan::query()->where('slug', 'pro')->firstOrFail();
        \Modules\Billing\Models\Subscription::query()->where('restaurant_id', $restaurant->id)->update(['plan_id' => $pro->id]);
        $this->deleteJson($this->api("admin/plans/{$pro->id}"))->assertStatus(422);
        $this->assertDatabaseHas('plans', ['id' => $pro->id]);
    }

    public function test_admin_can_update_plan_limits(): void
    {
        $this->actingAdmin();
        $pro = Plan::query()->where('slug', 'pro')->firstOrFail();

        $this->assertSame(1, $pro->max_menus);
        $this->assertSame(10, $pro->max_categories);
        $this->assertSame(120, $pro->max_products);
        $this->assertSame(2, $pro->max_product_images);
        $this->assertSame(200, $pro->max_storage_mb);

        $this->patchJson($this->api("admin/plans/{$pro->id}"), [
            'max_products' => 80,
            'max_categories' => 12,
            'max_storage_mb' => 250,
            'price_yearly' => 90,
        ])->assertOk()
            ->assertJsonPath('data.max_products', 80)
            ->assertJsonPath('data.max_categories', 12)
            ->assertJsonPath('data.max_storage_mb', 250)
            ->assertJsonPath('data.price_yearly', 90);
    }

    public function test_only_super_admin_edits_settings(): void
    {
        Sanctum::actingAs($this->makeUser(PlatformRole::Admin));
        $this->putJson($this->api('admin/settings'), ['settings' => ['support_email' => 'a@b.c']])->assertForbidden();

        Sanctum::actingAs($this->makeUser(PlatformRole::SuperAdmin));
        $this->putJson($this->api('admin/settings'), ['settings' => ['support_email' => 'a@b.c']])
            ->assertOk()->assertJsonPath('data.support_email', 'a@b.c');
    }

    public function test_demo_seeding_is_idempotent(): void
    {
        $this->actingAdmin();

        $this->postJson($this->api('admin/demo/demo'))->assertOk();
        $this->postJson($this->api('admin/demo/demo'))->assertOk();
        $this->postJson($this->api('admin/demo/unknown'))->assertNotFound();

        $this->assertSame(1, Restaurant::query()->where('slug', 'demo')->count());
    }
}
