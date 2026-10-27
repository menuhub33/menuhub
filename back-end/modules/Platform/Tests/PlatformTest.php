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
            'billing' => [
                'price' => 500, 'discount_type' => 'NONE', 'starts_on' => '2026-01-01', 'currency' => 'USD',
            ],
        ])->assertCreated()
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
