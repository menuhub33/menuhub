<?php

namespace Modules\Tenancy\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Tenancy\Models\ReservedSubdomain;

class ReservedSubdomainSeeder extends Seeder
{
    public function run(): void
    {
        $slugs = [
            'www', 'app', 'admin', 'api', 'dashboard', 'mail', 'support', 'help',
            'blog', 'docs', 'status', 'cdn', 'static', 'assets', 'login', 'signup', 'register',
        ];

        foreach ($slugs as $slug) {
            ReservedSubdomain::query()->firstOrCreate(['slug' => $slug]);
        }
    }
}
