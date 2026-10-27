<?php

namespace Modules\Platform\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Platform\Models\PlatformSetting;
use Modules\Shared\Http\Controllers\ApiController;

/**
 * Free-form key/value settings. Only a SUPER_ADMIN may change them.
 */
class PlatformSettingController extends ApiController
{
    public function index(): JsonResponse
    {
        return $this->ok(PlatformSetting::query()->pluck('value', 'key'));
    }

    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'فقط المدير الأعلى يمكنه تعديل إعدادات المنصة');

        $data = $request->validate([
            'settings' => ['required', 'array', 'min:1', 'max:50'],
            'settings.*' => ['nullable'],
        ]);

        foreach ($data['settings'] as $key => $value) {
            if (! is_string($key) || ! preg_match('/^[a-z0-9_.-]{1,100}$/', $key)) {
                return response()->json(['message' => "مفتاح الإعداد غير صالح: {$key}"], 422);
            }
            PlatformSetting::query()->updateOrCreate(['key' => $key], ['value' => $value, 'updated_at' => now()]);
        }

        return $this->index();
    }
}
