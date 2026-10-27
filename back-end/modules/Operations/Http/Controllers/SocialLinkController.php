<?php

namespace Modules\Operations\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Modules\Operations\Models\SocialLink;
use Modules\Shared\Events\RestaurantContentChanged;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Shared\Support\PhoneNumber;
use Modules\Shared\Support\Reorder;
use Modules\Tenancy\Models\Restaurant;

class SocialLinkController extends ApiController
{
    public const PLATFORMS = ['whatsapp', 'instagram', 'facebook', 'tiktok', 'twitter', 'youtube', 'snapchat', 'website'];

    public function index(Restaurant $restaurant): JsonResponse
    {
        return $this->ok(SocialLink::query()->where('restaurant_id', $restaurant->id)->orderBy('sort_order')->get());
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'platform' => ['required', Rule::in(self::PLATFORMS)],
            'url' => ['required', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $link = SocialLink::query()->create([
            'restaurant_id' => $restaurant->id,
            'platform' => $data['platform'],
            'url' => $this->normalize($data['platform'], $data['url']),
            'is_active' => $data['is_active'] ?? true,
            'sort_order' => $data['sort_order']
                ?? (int) SocialLink::query()->where('restaurant_id', $restaurant->id)->max('sort_order') + 1,
        ]);

        return $this->created($link->refresh());
    }

    public function update(Request $request, Restaurant $restaurant, string $link): JsonResponse
    {
        $model = $this->find($restaurant, $link);
        $data = $request->validate([
            'platform' => ['sometimes', Rule::in(self::PLATFORMS)],
            'url' => ['sometimes', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $platform = $data['platform'] ?? $model->platform;
        if (isset($data['url'])) {
            $data['url'] = $this->normalize($platform, $data['url']);
        }

        $model->update($data);

        return $this->ok($model->refresh());
    }

    public function setStatus(Request $request, Restaurant $restaurant, string $link): JsonResponse
    {
        $model = $this->find($restaurant, $link);
        $model->update($request->validate(['is_active' => ['required', 'boolean']]));

        return $this->ok($model->refresh());
    }

    public function reorder(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.id' => ['required', 'uuid'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        Reorder::apply(SocialLink::query()->where('restaurant_id', $restaurant->id), $data['items']);
        RestaurantContentChanged::dispatch($restaurant->id);

        return $this->message('تم تحديث الترتيب');
    }

    public function destroy(Restaurant $restaurant, string $link): JsonResponse
    {
        $this->find($restaurant, $link)->delete();

        return $this->noContent();
    }

    private function find(Restaurant $restaurant, string $id): SocialLink
    {
        return SocialLink::query()->where('restaurant_id', $restaurant->id)->findOrFail($id);
    }

    private function normalize(string $platform, string $value): string
    {
        $url = PhoneNumber::socialUrl($platform, $value);

        if (! $url) {
            throw ApiException::invalid($platform === 'whatsapp' ? 'رقم واتساب غير صالح' : 'الرابط غير صالح');
        }

        return $url;
    }
}
