<?php

namespace Modules\Theming\Database\Seeders;

use Illuminate\Database\Seeder;
use Modules\Theming\Models\Theme;

class ThemeSeeder extends Seeder
{
    public function run(): void
    {
        $themes = [
            ['Modern', 'modern', 'تصميم عصري', false],
            ['Classic', 'classic', 'تصميم كلاسيكي', false],
            ['Elegant', 'elegant', 'تصميم أنيق', true],
            ['Minimal', 'minimal', 'تصميم بسيط', false],
            ['Fast Food', 'fast-food', 'تصميم مناسب للمطاعم السريعة', true],
            ['Coffee', 'coffee', 'تصميم مناسب للمقاهي', true],
        ];

        foreach ($themes as [$name, $slug, $description, $premium]) {
            Theme::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'description' => $description, 'is_premium' => $premium, 'is_active' => true],
            );
        }
    }
}
