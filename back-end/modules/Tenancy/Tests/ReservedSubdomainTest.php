<?php

namespace Modules\Tenancy\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Shared\Tests\ApiTestCase;
use Modules\Tenancy\Models\ReservedSubdomain;

class ReservedSubdomainTest extends ApiTestCase
{
    public function test_admin_manages_reserved_subdomains(): void
    {
        $this->actingAdmin();

        $id = $this->postJson($this->api('admin/reserved-subdomains'), ['slug' => ' Billing '])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'billing')
            ->json('data.id');

        $this->postJson($this->api('admin/reserved-subdomains'), ['slug' => 'billing'])->assertUnprocessable();
        $this->getJson($this->api('admin/reserved-subdomains'))->assertOk()->assertJsonFragment(['slug' => 'billing']);

        $this->patchJson($this->api("admin/reserved-subdomains/{$id}"), ['slug' => 'payments'])
            ->assertOk()
            ->assertJsonPath('data.slug', 'payments');

        $this->deleteJson($this->api("admin/reserved-subdomains/{$id}"))->assertNoContent();
        $this->assertDatabaseMissing('reserved_subdomains', ['slug' => 'payments']);
    }

    public function test_reserved_slug_cannot_be_checked_as_available(): void
    {
        ReservedSubdomain::query()->create(['slug' => 'partners']);

        $this->getJson($this->api('slugs/check?slug=partners'))->assertOk()->assertJsonPath('data.available', false);
    }

    public function test_restaurant_owner_cannot_manage_reserved_subdomains(): void
    {
        [$owner] = $this->makeRestaurant();
        Sanctum::actingAs($owner);

        $this->getJson($this->api('admin/reserved-subdomains'))->assertForbidden();
        $this->postJson($this->api('admin/reserved-subdomains'), ['slug' => 'nope'])->assertForbidden();
    }
}
