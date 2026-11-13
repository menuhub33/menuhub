<?php

namespace Modules\Sales\Tests;

use Modules\Shared\Enums\RestaurantRole;

/** Product cost is a business secret: only roles that can read sales reports see or set it. */
class ProductCostTest extends SalesTestCase
{
    private function products(string $suffix = ''): string
    {
        return $this->api("restaurants/{$this->restaurant->id}/products{$suffix}");
    }

    public function test_owner_sets_and_reads_the_cost_price(): void
    {
        $this->as($this->owner);

        $this->patchJson($this->products("/{$this->product->id}"), ['cost_price' => 3500.5])
            ->assertOk()
            ->assertJsonPath('data.cost_price', 3500.5);

        $this->getJson($this->products("/{$this->product->id}"))->assertJsonPath('data.cost_price', 3500.5);
    }

    public function test_an_editor_neither_sees_nor_changes_the_cost(): void
    {
        $this->product->forceFill(['cost_price' => 4000])->save();

        $this->as($this->staff(RestaurantRole::Editor));

        $this->getJson($this->products("/{$this->product->id}"))
            ->assertOk()->assertJsonMissingPath('data.cost_price');

        $this->patchJson($this->products("/{$this->product->id}"), ['cost_price' => 1, 'name_ar' => 'جديد'])
            ->assertOk()->assertJsonMissingPath('data.cost_price');

        $this->assertSame('4000.00', (string) $this->product->refresh()->cost_price);
    }

    public function test_price_and_cost_are_both_required_for_the_owner(): void
    {
        $this->as($this->owner);
        $base = ['category_id' => $this->product->category_id, 'name_ar' => 'جديد'];

        $this->postJson($this->products(), $base + ['cost_price' => 10])->assertStatus(422)->assertJsonValidationErrors('price');
        $this->postJson($this->products(), $base + ['price' => 50])->assertStatus(422)->assertJsonValidationErrors('cost_price');
        $this->postJson($this->products(), $base + ['price' => 50, 'cost_price' => 20])->assertCreated();

        // Clearing either on an existing product is refused too.
        $this->patchJson($this->products("/{$this->product->id}"), ['price' => null])->assertStatus(422);
        $this->patchJson($this->products("/{$this->product->id}"), ['cost_price' => null])->assertStatus(422);
    }

    public function test_an_editor_can_still_create_products_without_a_cost(): void
    {
        $this->as($this->staff(RestaurantRole::Editor));

        $this->postJson($this->products(), [
            'category_id' => $this->product->category_id,
            'name_ar' => 'من المحرر',
            'price' => 70,
        ])->assertCreated()->assertJsonMissingPath('data.cost_price');
    }

    public function test_one_switch_hides_every_price_on_the_public_menu(): void
    {
        $menu = \Modules\Catalog\Models\Menu::query()->where('restaurant_id', $this->restaurant->id)->firstOrFail();
        $this->as($this->owner);
        $this->postJson($this->api("restaurants/{$this->restaurant->id}/menus/{$menu->id}/publish"))->assertOk();
        $this->product->forceFill(['old_price' => 15000])->save();

        $public = fn () => $this->getJson($this->api("public/menus/{$this->restaurant->slug}"))->assertOk()->json('data.data');

        $this->assertSame(10000, (int) $public()['categories'][0]['products'][0]['price']);

        $this->patchJson($this->api("restaurants/{$this->restaurant->id}/menus/{$menu->id}"), ['show_prices' => false])
            ->assertOk()->assertJsonPath('data.show_prices', false);

        $after = $public();
        $this->assertFalse($after['menu']['show_prices']);
        $this->assertNull($after['categories'][0]['products'][0]['price']);
        $this->assertNull($after['categories'][0]['products'][0]['old_price']);

        // The dashboard still sees the real prices.
        $this->getJson($this->products("/{$this->product->id}"))->assertJsonPath('data.price', 10000);

        $this->patchJson($this->api("restaurants/{$this->restaurant->id}/menus/{$menu->id}"), ['show_prices' => true])->assertOk();
        $this->assertSame(10000, (int) $public()['categories'][0]['products'][0]['price']);
    }}
