<?php

namespace Modules\Theming\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Mall;
use Modules\Tenancy\Support\MallAccess;
use Modules\Theming\Services\ThemeService;

class MallThemeController extends ApiController
{
    private const COLOR = ['sometimes', 'string', 'regex:/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/'];

    public function __construct(private readonly ThemeService $themes) {}

    public function current(Request $request): JsonResponse
    {
        return $this->ok($this->themes->forMall($this->ownMall($request)->id)->load('theme'));
    }

    public function updateCurrent(Request $request): JsonResponse
    {
        return $this->ok($this->themes->updateMall($this->ownMall($request)->id, $this->validated($request)));
    }

    public function show(Mall $mall): JsonResponse
    {
        return $this->ok($this->themes->forMall($mall->id)->load('theme'));
    }

    public function update(Request $request, Mall $mall): JsonResponse
    {
        return $this->ok($this->themes->updateMall($mall->id, $this->validated($request)));
    }

    private function ownMall(Request $request): Mall
    {
        $mall = MallAccess::membership($request->user())?->mall;
        if (! $mall) {
            throw ApiException::notFound('لا يوجد مول مرتبط بهذا الحساب');
        }

        return $mall;
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'theme_id' => ['nullable', 'uuid', 'exists:themes,id'],
            'primary_color' => self::COLOR,
            'secondary_color' => self::COLOR,
            'background_color' => self::COLOR,
            'text_color' => self::COLOR,
            'font_family' => ['nullable', 'string', 'max:100', 'regex:/^[\p{L}\p{N} _-]+$/u'],
            'custom_css' => ['nullable', 'string', 'max:20000'],
        ]);
    }
}
