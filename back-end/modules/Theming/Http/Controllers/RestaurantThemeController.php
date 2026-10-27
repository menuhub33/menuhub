<?php

namespace Modules\Theming\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Theming\Services\ThemeService;

class RestaurantThemeController extends ApiController
{
    private const COLOR = ['sometimes', 'string', 'regex:/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/'];

    public function __construct(private readonly ThemeService $themes) {}

    public function show(Restaurant $restaurant): JsonResponse
    {
        return $this->ok($this->themes->forRestaurant($restaurant->id)->load('theme'));
    }

    public function update(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'theme_id' => ['nullable', 'uuid', 'exists:themes,id'],
            'primary_color' => self::COLOR,
            'secondary_color' => self::COLOR,
            'background_color' => self::COLOR,
            'text_color' => self::COLOR,
            'font_family' => ['nullable', 'string', 'max:100', 'regex:/^[\p{L}\p{N} _-]+$/u'],
            'custom_css' => ['nullable', 'string', 'max:20000'],
        ]);

        return $this->ok($this->themes->update($restaurant->id, $data));
    }
}
