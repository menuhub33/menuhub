<?php

namespace Modules\Shared\Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Modules\Billing\Database\Seeders\PlanSeeder;
use Modules\Catalog\Models\Category;
use Modules\Catalog\Models\Menu;
use Modules\Catalog\Models\Product;
use Modules\Platform\Services\ProvisioningService;
use Modules\Platform\Services\RestaurantAdminService;
use Modules\Shared\Enums\PlatformRole;
use Modules\Shared\Enums\RestaurantRole;
use Modules\Shared\Enums\RestaurantStatus;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Theming\Database\Seeders\ThemeSeeder;
use Modules\Users\Models\User;
use Modules\Users\Services\UserService;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([PlanSeeder::class, ThemeSeeder::class]);
    }

    protected function api(string $path = ''): string
    {
        return '/api/v1/'.ltrim($path, '/');
    }

    protected function makeUser(PlatformRole $role = PlatformRole::User, ?string $email = null): User
    {
        return app(UserService::class)->create([
            'full_name' => 'Test User',
            'email' => $email ?? fake()->unique()->safeEmail(),
            'password' => 'password123',
        ], $role, verified: true);
    }

    protected function actingAdmin(PlatformRole $role = PlatformRole::SuperAdmin): User
    {
        $admin = $this->makeUser($role);
        Sanctum::actingAs($admin);

        return $admin;
    }

    /** A fully provisioned, ACTIVE restaurant with its owner. @return array{0: User, 1: Restaurant} */
    protected function makeRestaurant(string $name = 'Test Place', bool $activate = true): array
    {
        $restaurant = app(ProvisioningService::class)->create([
            'name' => $name,
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password123',
            'slug' => 'place-'.fake()->unique()->numberBetween(100, 99999),
        ]);

        if ($activate) {
            $restaurant = app(RestaurantAdminService::class)->setStatus($restaurant, RestaurantStatus::Active);
        }

        $owner = RestaurantUser::query()->where('restaurant_id', $restaurant->id)->firstOrFail()->user;

        return [$owner, $restaurant];
    }

    protected function addStaff(Restaurant $restaurant, RestaurantRole $role): User
    {
        $user = $this->makeUser();
        RestaurantUser::query()->create([
            'restaurant_id' => $restaurant->id,
            'user_id' => $user->id,
            'role' => $role,
            'is_active' => true,
        ]);

        return $user;
    }

    protected function defaultMenu(Restaurant $restaurant): Menu
    {
        return Menu::query()->where('restaurant_id', $restaurant->id)->where('is_default', true)->firstOrFail();
    }

    protected function makeCategory(Restaurant $restaurant, string $name = 'أقسام'): Category
    {
        return Category::query()->create([
            'menu_id' => $this->defaultMenu($restaurant)->id,
            'name_ar' => $name,
            'is_active' => true,
        ]);
    }

    protected function makeProduct(Category $category, array $attributes = []): Product
    {
        return Product::query()->create($attributes + [
            'category_id' => $category->id,
            'name_ar' => 'منتج',
            'price' => 10000,
            'currency' => 'SYP',
        ]);
    }
}
