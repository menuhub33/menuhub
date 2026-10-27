<?php

namespace Modules\Theming\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Rules\ImageUrl;
use Modules\Theming\Models\Theme;

/**
 * Theme gallery: public read, admin-only write.
 */
class ThemeController extends ApiController
{
    public function index(): JsonResponse
    {
        return $this->ok(Theme::query()->where('is_active', true)->orderBy('is_premium')->orderBy('name')->get());
    }

    public function adminIndex(): JsonResponse
    {
        return $this->ok(Theme::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        return $this->created(Theme::query()->create($request->validate([
            'name' => ['required', 'string', 'max:100'],
            'slug' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:themes,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
            'preview_image_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'is_active' => ['sometimes', 'boolean'],
            'is_premium' => ['sometimes', 'boolean'],
        ])));
    }

    public function update(Request $request, Theme $theme): JsonResponse
    {
        $theme->update($request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'slug' => ['sometimes', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:themes,slug,'.$theme->id],
            'description' => ['nullable', 'string', 'max:1000'],
            'preview_image_url' => ['nullable', 'string', 'max:2000', new ImageUrl],
            'is_active' => ['sometimes', 'boolean'],
            'is_premium' => ['sometimes', 'boolean'],
        ]));

        return $this->ok($theme->refresh());
    }

    public function destroy(Theme $theme): JsonResponse
    {
        $theme->delete();

        return $this->noContent();
    }
}
