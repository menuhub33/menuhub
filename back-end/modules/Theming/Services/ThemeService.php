<?php

namespace Modules\Theming\Services;

use Modules\Theming\Models\RestaurantTheme;
use Modules\Theming\Models\Theme;

class ThemeService
{
    public const DEFAULTS = [
        'primary_color' => '#0f766e',
        'secondary_color' => '#115e59',
        'background_color' => '#fafafa',
        'text_color' => '#18181b',
        'font_family' => 'Expo Arabic',
    ];

    /** The theme row of a restaurant, created with the default palette if missing. */
    public function forRestaurant(string $restaurantId): RestaurantTheme
    {
        return RestaurantTheme::query()->firstOrCreate(
            ['restaurant_id' => $restaurantId],
            [
                ...self::DEFAULTS,
                'theme_id' => Theme::query()->where('slug', 'modern')->value('id'),
            ],
        );
    }

    /** @param  array<string, mixed>  $data */
    public function update(string $restaurantId, array $data): RestaurantTheme
    {
        $theme = $this->forRestaurant($restaurantId);

        if (array_key_exists('custom_css', $data)) {
            $data['custom_css'] = $this->sanitizeCss($data['custom_css']);
        }

        $theme->fill(array_intersect_key($data, array_flip([
            'theme_id', 'primary_color', 'secondary_color', 'background_color',
            'text_color', 'font_family', 'custom_css',
        ])))->save();

        return $theme->refresh()->load('theme');
    }

    /**
     * Customer CSS is rendered on a public page, so strip everything that can
     * load remote code or break out of the <style> element.
     */
    public function sanitizeCss(?string $css): ?string
    {
        if ($css === null || trim($css) === '') {
            return null;
        }

        $css = preg_replace('#</?\s*style[^>]*>#i', '', $css) ?? '';
        $css = str_replace(['<', '>'], '', $css);
        $css = preg_replace('/@import[^;]*;?/i', '', $css) ?? '';
        $css = preg_replace('/expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|-moz-binding/i', '', $css) ?? '';
        $css = preg_replace('/url\s*\(\s*([\'"]?)\s*data:[^)]*\)/i', '', $css) ?? '';

        return trim($css) === '' ? null : $css;
    }
}
