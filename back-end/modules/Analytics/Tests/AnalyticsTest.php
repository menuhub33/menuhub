<?php

namespace Modules\Analytics\Tests;

use Laravel\Sanctum\Sanctum;
use Modules\Analytics\Models\AnalyticsEvent;
use Modules\Shared\Tests\ApiTestCase;

class AnalyticsTest extends ApiTestCase
{
    public function test_visitors_can_record_events_and_owner_reads_the_summary(): void
    {
        [$owner, $restaurant] = $this->makeRestaurant();
        $product = $this->makeProduct($this->makeCategory($restaurant));
        $path = $this->api("public/menus/{$restaurant->slug}/events");

        $this->postJson($path, ['event_type' => 'MENU_VIEW', 'visitor_id' => 'v1'])->assertStatus(202);
        $this->postJson($path, ['event_type' => 'PRODUCT_VIEW', 'product_id' => $product->id])->assertStatus(202);
        $this->postJson($path, ['event_type' => 'QR_SCAN'])->assertStatus(202);

        $this->assertSame(3, AnalyticsEvent::query()->where('restaurant_id', $restaurant->id)->count());

        Sanctum::actingAs($owner);
        $this->getJson($this->api("restaurants/{$restaurant->id}/dashboard"))
            ->assertOk()
            ->assertJsonPath('data.todayViews', 1)
            ->assertJsonPath('data.summary.qrScans', 1)
            ->assertJsonPath('data.summary.productViews', 1);
    }

    public function test_unknown_event_types_are_rejected(): void
    {
        [, $restaurant] = $this->makeRestaurant();

        $this->postJson($this->api("public/menus/{$restaurant->slug}/events"), ['event_type' => 'HACK'])
            ->assertStatus(422);
    }

    public function test_foreign_product_ids_are_ignored(): void
    {
        [, $restaurantA] = $this->makeRestaurant('A');
        [, $restaurantB] = $this->makeRestaurant('B');
        $foreign = $this->makeProduct($this->makeCategory($restaurantB));

        $this->postJson($this->api("public/menus/{$restaurantA->slug}/events"), [
            'event_type' => 'PRODUCT_VIEW', 'product_id' => $foreign->id,
        ])->assertStatus(202);

        $this->assertNull(AnalyticsEvent::query()->where('restaurant_id', $restaurantA->id)->firstOrFail()->product_id);
    }

    public function test_events_for_suspended_restaurants_are_refused(): void
    {
        [, $restaurant] = $this->makeRestaurant(activate: false);

        $this->postJson($this->api("public/menus/{$restaurant->slug}/events"), ['event_type' => 'MENU_VIEW'])
            ->assertNotFound();
    }
}
