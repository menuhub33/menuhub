<?php

namespace Modules\Shared\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Routing\Controller;

/**
 * Common response helpers. Every successful payload is wrapped in `data`.
 */
abstract class ApiController extends Controller
{
    protected function ok(mixed $data = null, int $status = 200, array $meta = []): JsonResponse
    {
        if ($data instanceof JsonResource) {
            return $data->response()->setStatusCode($status);
        }

        $body = ['data' => $data];
        if ($meta !== []) {
            $body['meta'] = $meta;
        }

        return response()->json($body, $status);
    }

    protected function created(mixed $data = null): JsonResponse
    {
        return $this->ok($data, 201);
    }

    protected function message(string $message, int $status = 200): JsonResponse
    {
        return response()->json(['message' => $message], $status);
    }

    protected function noContent(): JsonResponse
    {
        return response()->json(null, 204);
    }

    protected function perPage(int $default = 25, int $max = 100): int
    {
        return max(1, min($max, (int) request()->integer('per_page', $default)));
    }
}
