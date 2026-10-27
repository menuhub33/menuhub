<?php

namespace Modules\Media\Http\Controllers;

use Modules\Media\Services\MediaStorage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Streams a stored image. The R2 S3 endpoint is not anonymously readable. */
class MediaFileController
{
    public function __construct(private readonly MediaStorage $media) {}

    public function show(string $path): StreamedResponse
    {
        $key = $this->media->validKey($path);
        abort_unless($key && $this->media->disk()->exists($key), 404);

        $mime = match (strtolower(pathinfo($key, PATHINFO_EXTENSION))) {
            'jpg', 'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            default => 'application/octet-stream',
        };

        return response()->stream(function () use ($key) {
            $stream = $this->media->disk()->readStream($key);
            if (is_resource($stream)) {
                fpassthru($stream);
                fclose($stream);
            }
        }, 200, [
            'Content-Type' => $mime,
            'Cache-Control' => 'public, max-age=31536000, immutable',
        ]);
    }
}
