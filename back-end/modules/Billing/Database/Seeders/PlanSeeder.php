<?php

namespace Modules\Billing\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Billing\Models\Plan;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Free', 'slug' => 'free', 'description' => 'الخطة المجانية',
                'price_monthly' => 0, 'price_yearly' => 0, 'currency' => 'USD',
                'max_menus' => 1, 'max_products' => 30, 'max_branches' => 1, 'max_staff' => 1,
                'analytics_enabled' => false, 'custom_domain_enabled' => false,
                'remove_branding' => false, 'advanced_analytics' => false,
            ],
            [
                'name' => 'Pro', 'slug' => 'pro', 'description' => 'الخطة الاحترافية',
                'price_monthly' => 10, 'price_yearly' => 100, 'currency' => 'USD',
                'max_menus' => 5, 'max_products' => null, 'max_branches' => 1, 'max_staff' => 5,
                'analytics_enabled' => true, 'custom_domain_enabled' => false,
                'remove_branding' => true, 'advanced_analytics' => false,
            ],
            [
                'name' => 'Business', 'slug' => 'business', 'description' => 'خطة الشركات',
                'price_monthly' => 25, 'price_yearly' => 250, 'currency' => 'USD',
                'max_menus' => null, 'max_products' => null, 'max_branches' => null, 'max_staff' => null,
                'analytics_enabled' => true, 'custom_domain_enabled' => true,
                'remove_branding' => true, 'advanced_analytics' => true,
            ],
        ];

        foreach ($plans as $plan) {
            Plan::query()->updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
