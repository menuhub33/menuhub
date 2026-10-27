<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Billing\Database\Seeders\PlanSeeder;
use Modules\Platform\Services\DemoCatalogService;
use Modules\Platform\Support\DemoData;
use Modules\Shared\Enums\PlatformRole;
use Modules\Tenancy\Database\Seeders\ReservedSubdomainSeeder;
use Modules\Theming\Database\Seeders\ThemeSeeder;
use Modules\Users\Models\User;
use Modules\Users\Services\UserService;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            PlanSeeder::class,
            ThemeSeeder::class,
            ReservedSubdomainSeeder::class,
        ]);

        $this->seedSuperAdmin();

        if (config('menuhub.seed_demo', true)) {
            foreach (DemoData::KEYS as $slug) {
                app(DemoCatalogService::class)->seed($slug);
            }
        }
    }

    /** Creates the first platform administrator from SUPER_ADMIN_* env variables. */
    private function seedSuperAdmin(): void
    {
        $email = config('menuhub.super_admin.email');
        $password = config('menuhub.super_admin.password');

        if (! $email || ! $password || User::query()->where('email', strtolower($email))->exists()) {
            return;
        }

        app(UserService::class)->create([
            'full_name' => config('menuhub.super_admin.name'),
            'email' => $email,
            'password' => $password,
        ], PlatformRole::SuperAdmin, verified: true);
    }
}
