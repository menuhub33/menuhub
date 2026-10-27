<?php

namespace Modules\Tenancy\Providers;

use Illuminate\Support\Facades\Route;
use Modules\Shared\Support\ModuleServiceProvider;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Users\Models\User;

class TenancyServiceProvider extends ModuleServiceProvider
{
    protected function bootModule(): void
    {
        // {restaurant} is always a restaurant id (UUID).
        Route::model('restaurant', Restaurant::class);

        // {membership} is scoped to the restaurant in the URL.
        Route::bind('membership', function (string $value, $route) {
            $restaurant = $route->parameter('restaurant');
            $restaurantId = $restaurant instanceof Restaurant ? $restaurant->id : $restaurant;

            return RestaurantUser::query()
                ->where('restaurant_id', $restaurantId)
                ->findOrFail($value);
        });

        // The Users module does not know about tenants; Tenancy extends it.
        User::resolveRelationUsing('memberships', fn (User $user) => $user->hasMany(RestaurantUser::class));
    }
}
