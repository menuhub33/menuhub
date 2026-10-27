<?php

namespace Modules\Media\Services;

use Modules\Shared\Exceptions\ApiException;

/**
 * Port of the front-end `optimize-image.ts` (sharp): resize to a maximum edge
 * and re-encode as WebP. Uses GD when WebP support is available, otherwise
 * the validated original is stored untouched.
 */
class ImageOptimizer
{
    private const MAX_PIXELS = 80_000_000;

    private const TYPES = [
        IMAGETYPE_JPEG => ['image/jpeg', 'jpg'],
        IMAGETYPE_PNG => ['image/png', 'png'],
        IMAGETYPE_GIF => ['image/gif', 'gif'],
        IMAGETYPE_WEBP => ['image/webp', 'webp'],
    ];

    public function canConvert(): bool
    {
        return extension_loaded('gd') && function_exists('imagewebp');
    }

    /**
     * @return array{width:int,height:int,mime:string,ext:string}
     */
    public function inspect(string $bytes): array
    {
        $info = @getimagesizefromstring($bytes);

        if ($info === false || ! isset(self::TYPES[$info[2]])) {
            throw ApiException::invalid('الملف ليس صورة صالحة (JPG, PNG, WEBP, GIF)', 'INVALID_IMAGE');
        }

        if ($info[0] * $info[1] > self::MAX_PIXELS) {
            throw ApiException::invalid('أبعاد الصورة كبيرة جداً', 'IMAGE_TOO_LARGE');
        }

        [$mime, $ext] = self::TYPES[$info[2]];

        return ['width' => $info[0], 'height' => $info[1], 'mime' => $mime, 'ext' => $ext];
    }

    /**
     * @return array{bytes:string,mime:string,ext:string}
     */
    public function optimize(string $bytes, int $maxEdge, int $quality): array
    {
        $meta = $this->inspect($bytes);

        if (! $this->canConvert() || $meta['mime'] === 'image/gif') {
            return ['bytes' => $bytes, 'mime' => $meta['mime'], 'ext' => $meta['ext']];
        }

        $source = @imagecreatefromstring($bytes);
        if (! $source) {
            throw ApiException::invalid('تعذر قراءة الصورة', 'INVALID_IMAGE');
        }

        $scale = min(1, $maxEdge / max($meta['width'], $meta['height']));
        $width = max(1, (int) round($meta['width'] * $scale));
        $height = max(1, (int) round($meta['height'] * $scale));

        $canvas = imagecreatetruecolor($width, $height);
        imagealphablending($canvas, false);
        imagesavealpha($canvas, true);
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $width, $height, $meta['width'], $meta['height']);

        ob_start();
        imagewebp($canvas, null, $quality);
        $webp = (string) ob_get_clean();

        imagedestroy($source);
        imagedestroy($canvas);

        return ['bytes' => $webp, 'mime' => 'image/webp', 'ext' => 'webp'];
    }
}
