<?php

namespace Modules\Media\Services;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Shared\Exceptions\ApiException;

/**
 * Stores uploaded images on the configured disk (local "public" or R2).
 * Object keys: {folder}/{userId}/{uuid}.{ext} (+ `@640` card variant).
 */
class MediaStorage
{
    public function __construct(private readonly ImageOptimizer $optimizer) {}

    public function disk(): Filesystem
    {
        return Storage::disk(config('menuhub.media.disk'));
    }

    public function resolveFolder(?string $folder): string
    {
        $folder = strtolower(trim((string) $folder));
        $folder = explode('/', str_replace('\\', '/', $folder))[0];

        return in_array($folder, config('menuhub.media.folders'), true) ? $folder : 'uploads';
    }

    /**
     * @return array{key:string,url:string,card_url:?string,size:int,mime:string}
     */
    public function store(string $bytes, string $folder, string $userId): array
    {
        $folder = $this->resolveFolder($folder);
        [$maxEdge, $quality] = config("menuhub.media.sizes.{$folder}");

        $main = $this->optimizer->optimize($bytes, $maxEdge, $quality);
        $id = (string) Str::uuid();
        $key = "{$folder}/{$userId}/{$id}.{$main['ext']}";

        $this->put($key, $main['bytes'], $main['mime']);

        $cardUrl = null;
        if ($folder === 'products' && $this->optimizer->canConvert()) {
            $card = $this->optimizer->optimize(
                $bytes,
                (int) config('menuhub.media.card_width', 640),
                (int) config('menuhub.media.card_quality', 70),
            );
            $cardKey = "{$folder}/{$userId}/{$id}@".config('menuhub.media.card_width', 640).".{$card['ext']}";
            $this->put($cardKey, $card['bytes'], $card['mime']);
            $cardUrl = $this->url($cardKey);
        }

        return [
            'key' => $key,
            'url' => $this->url($key),
            'card_url' => $cardUrl,
            'size' => strlen($main['bytes']),
            'mime' => $main['mime'],
        ];
    }

    public function url(string $key): string
    {
        $base = config('menuhub.media.public_url');

        return $base ? rtrim($base, '/').'/'.$key : $this->disk()->url($key);
    }

    /**
     * Maps a public URL back to an object key, or null if it is not ours.
     */
    public function keyFromUrl(string $url): ?string
    {
        $prefix = rtrim((string) (config('menuhub.media.public_url') ?: $this->disk()->url('')), '/').'/';

        if (! str_starts_with($url, $prefix)) {
            return null;
        }

        $key = ltrim(substr($url, strlen($prefix)), '/');
        $pattern = '#^('.implode('|', config('menuhub.media.folders')).')/[0-9a-f-]{36}/[0-9a-f-]{36}(@\d+)?\.(jpg|png|gif|webp)$#i';

        return preg_match($pattern, $key) ? $key : null;
    }

    public function delete(string $key): void
    {
        $this->disk()->delete($key);

        // Remove the product card variant together with the main file.
        $card = preg_replace('/(\.[a-z]+)$/i', '@'.config('menuhub.media.card_width', 640).'$1', $key);
        if ($card && $card !== $key) {
            $this->disk()->delete($card);
        }
    }

    private function put(string $key, string $bytes, string $mime): void
    {
        $ok = $this->disk()->put($key, $bytes, [
            'visibility' => 'public',
            'ContentType' => $mime,
            'CacheControl' => 'public, max-age=31536000, immutable',
        ]);

        if (! $ok) {
            throw new ApiException('تعذر حفظ الصورة', 500, 'STORAGE_FAILED');
        }
    }
}
