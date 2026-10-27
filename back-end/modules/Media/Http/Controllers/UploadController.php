<?php

namespace Modules\Media\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Media\Services\MediaStorage;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\RestaurantUser;
use Modules\Users\Models\User;

/**
 * Image uploads. Unlike the original Next.js route, an upload must be tied to
 * a restaurant the caller belongs to (or an admin), so random accounts cannot
 * fill the bucket.
 */
class UploadController extends ApiController
{
    public function __construct(private readonly MediaStorage $media) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'max:'.config('menuhub.media.max_kb')],
            'folder' => ['nullable', 'string', 'max:50'],
            'restaurant_id' => ['nullable', 'uuid'],
        ]);

        /** @var User $user */
        $user = $request->user();
        $this->authorizeUpload($user, $data['restaurant_id'] ?? null);

        $bytes = (string) file_get_contents($request->file('file')->getRealPath());
        $stored = $this->media->store($bytes, $data['folder'] ?? 'uploads', $user->id);

        return $this->created([
            'url' => $stored['url'],
            'card_url' => $stored['card_url'],
            'size' => $stored['size'],
            'mime' => $stored['mime'],
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['url' => ['required', 'string', 'max:2000']]);

        $key = $this->media->keyFromUrl($data['url']);
        if (! $key) {
            throw ApiException::invalid('رابط الصورة غير صالح', 'INVALID_URL');
        }

        $owner = explode('/', $key)[1] ?? null;
        $user = $request->user();
        if ($owner !== $user->id && ! $user->isPlatformAdmin()) {
            throw ApiException::forbidden('لا يمكنك حذف هذه الصورة');
        }

        $this->media->delete($key);

        return $this->noContent();
    }

    private function authorizeUpload(User $user, ?string $restaurantId): void
    {
        if ($user->isPlatformAdmin()) {
            return;
        }

        $allowed = $restaurantId && RestaurantUser::query()
            ->where('restaurant_id', $restaurantId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if (! $allowed) {
            throw ApiException::forbidden('الرفع متاح لأعضاء النشاط فقط. أرسل restaurant_id', 'UPLOAD_FORBIDDEN');
        }
    }
}
