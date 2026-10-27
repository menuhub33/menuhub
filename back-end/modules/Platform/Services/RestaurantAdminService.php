<?php

namespace Modules\Platform\Services;

use Modules\Catalog\Models\Menu;
use Modules\Shared\Enums\BusinessType;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Shared\Events\RestaurantStatusChanged;
use Modules\Tenancy\Models\Restaurant;

/**
 * Lifecycle operations only a platform administrator may perform.
 */
class RestaurantAdminService
{
    /**
     * Activating (ACTIVE / TRIAL) also publishes the restaurant and its
     * default menu, exactly like the original admin action.
     *
     * @param  array<string, mixed>  $attributes  extra columns to update in the same save
     */
    public function setStatus(Restaurant $restaurant, RestaurantStatus $status, array $attributes = []): Restaurant
    {
        $from = $restaurant->status->value;

        $restaurant->fill($attributes);
        $restaurant->status = $status;

        if ($status->isOperational()) {
            $restaurant->menu_status = MenuStatus::Published;
        }

        $restaurant->save();

        if ($status->isOperational()) {
            Menu::query()->where('restaurant_id', $restaurant->id)->where('is_default', true)->get()
                ->each(fn (Menu $menu) => $menu->update(['status' => MenuStatus::Published, 'published_at' => now()]));
        }

        if ($from !== $status->value) {
            RestaurantStatusChanged::dispatch($restaurant->id, $restaurant->name, $from, $status->value);
        }

        return $restaurant->refresh();
    }

    public function setBusinessType(Restaurant $restaurant, string $type): Restaurant
    {
        $restaurant->business_type = BusinessType::normalize($type);
        $restaurant->save();

        return $restaurant->refresh();
    }
}
