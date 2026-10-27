<?php

namespace Modules\Operations\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Modules\Catalog\Models\Menu;
use Modules\Operations\Models\Branch;
use Modules\Operations\Models\QrCode;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class QrCodeController extends ApiController
{
    public function index(Restaurant $restaurant): JsonResponse
    {
        return $this->ok(QrCode::query()->where('restaurant_id', $restaurant->id)->latest('created_at')->get());
    }

    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'menu_id' => ['nullable', 'uuid'],
            'branch_id' => ['nullable', 'uuid'],
            'logo_enabled' => ['sometimes', 'boolean'],
            'format' => ['sometimes', Rule::in(['PNG', 'SVG'])],
            'size' => ['sometimes', 'integer', 'between:128,2000'],
        ]);

        $menu = $this->menu($restaurant, $data['menu_id'] ?? null);
        $this->assertBranch($restaurant, $data['branch_id'] ?? null);

        $qr = new QrCode([
            'restaurant_id' => $restaurant->id,
            'branch_id' => $data['branch_id'] ?? null,
            'menu_id' => $menu->id,
            'name' => $data['name'],
            'logo_enabled' => $data['logo_enabled'] ?? false,
            'format' => $data['format'] ?? 'PNG',
        ]);
        $qr->id = (string) Str::uuid();
        $qr->qr_url = $this->imageUrl($restaurant, $qr, $data['size'] ?? 512);
        $qr->save();

        return $this->created($this->present($qr->refresh(), $restaurant));
    }

    public function update(Request $request, Restaurant $restaurant, string $qr): JsonResponse
    {
        $model = $this->find($restaurant, $qr);
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'logo_enabled' => ['sometimes', 'boolean'],
            'format' => ['sometimes', Rule::in(['PNG', 'SVG'])],
            'size' => ['sometimes', 'integer', 'between:128,2000'],
        ]);

        $model->fill(array_intersect_key($data, array_flip(['name', 'logo_enabled', 'format'])));
        $model->qr_url = $this->imageUrl($restaurant, $model, $data['size'] ?? 512);
        $model->save();

        return $this->ok($this->present($model->refresh(), $restaurant));
    }

    public function destroy(Restaurant $restaurant, string $qr): JsonResponse
    {
        $this->find($restaurant, $qr)->delete();

        return $this->noContent();
    }

    private function find(Restaurant $restaurant, string $id): QrCode
    {
        return QrCode::query()->where('restaurant_id', $restaurant->id)->findOrFail($id);
    }

    private function menu(Restaurant $restaurant, ?string $menuId): Menu
    {
        $menu = $menuId
            ? Menu::query()->where('restaurant_id', $restaurant->id)->find($menuId)
            : (Menu::query()->where('restaurant_id', $restaurant->id)->where('is_default', true)->first()
                ?? Menu::query()->where('restaurant_id', $restaurant->id)->first());

        return $menu ?? throw ApiException::invalid('لا توجد قائمة لربط الرمز بها', 'MENU_NOT_FOUND');
    }

    private function assertBranch(Restaurant $restaurant, ?string $branchId): void
    {
        if ($branchId && ! Branch::query()->where('restaurant_id', $restaurant->id)->whereKey($branchId)->exists()) {
            throw ApiException::invalid('الفرع غير موجود', 'BRANCH_NOT_FOUND');
        }
    }

    /**
     * The code points at the public menu with `src=qr&qr={id}` so that the
     * front-end can emit a QR_SCAN analytics event on arrival.
     */
    private function targetUrl(Restaurant $restaurant, QrCode $qr): string
    {
        return $restaurant->publicUrl().'?'.http_build_query(['src' => 'qr', 'qr' => $qr->id]);
    }

    private function imageUrl(Restaurant $restaurant, QrCode $qr, int $size): string
    {
        return config('menuhub.qr.generator').'?'.http_build_query([
            'size' => "{$size}x{$size}",
            'format' => strtolower($qr->format),
            'margin' => 10,
            'data' => $this->targetUrl($restaurant, $qr),
        ]);
    }

    /** @return array<string, mixed> */
    private function present(QrCode $qr, Restaurant $restaurant): array
    {
        return $qr->toArray() + ['target_url' => $this->targetUrl($restaurant, $qr)];
    }
}
