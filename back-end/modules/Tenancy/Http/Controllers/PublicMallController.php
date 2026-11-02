<?php

namespace Modules\Tenancy\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Modules\Shared\Enums\MenuStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Mall;
use Modules\Tenancy\Models\Restaurant;
use Modules\Theming\Services\ThemeService;

class PublicMallController extends ApiController
{
    public function __construct(private readonly ThemeService $themes) {}

    /** Directory of a published mall: store cards, not a second product catalog. */
    public function show(string $slug): JsonResponse
    {
        $mall = Mall::query()->where('slug', strtolower(trim($slug)))->first();

        if (! $mall || ! $mall->isPublished()) {
            return $this->ok([
                'kind' => 'unavailable',
                'reason' => $mall ? 'UNPUBLISHED' : 'NOT_FOUND',
                'name' => $mall?->name,
            ]);
        }

        $stores = Restaurant::query()
            ->where('mall_id', $mall->id)
            ->whereIn('status', ['TRIAL', 'ACTIVE'])
            ->where('menu_status', MenuStatus::Published->value)
            ->orderBy('name')
            ->get()
            ->map(fn (Restaurant $store) => [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'business_type' => $store->business_type->value,
                'logo_url' => $store->logo_url,
                'cover_image_url' => $store->cover_image_url,
                'description' => $store->description,
                'public_url' => $store->publicUrl(),
            ])
            ->values();

        $theme = $this->themes->forMall($mall->id);

        return $this->ok([
            'kind' => 'live',
            'mall' => [
                'id' => $mall->id,
                'name' => $mall->name,
                'slug' => $mall->slug,
                'description' => $mall->description,
                'phone' => $mall->phone,
                'logo_url' => $mall->logo_url,
                'cover_image_url' => $mall->cover_image_url,
                'address' => $mall->address,
            ],
            'theme' => [
                'primary_color' => $theme->primary_color,
                'secondary_color' => $theme->secondary_color,
                'background_color' => $theme->background_color,
                'text_color' => $theme->text_color,
                'font_family' => $theme->font_family,
                'custom_css' => $theme->custom_css,
            ],
            'stores' => $stores,
        ])->header('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    }
}
