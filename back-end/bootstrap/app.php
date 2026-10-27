<?php

use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Modules\Auth\Http\Middleware\EnsurePlatformAdmin;
use Modules\Auth\Http\Middleware\EnsureUserIsActive;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Http\Middleware\EnsureRestaurantActive;
use Modules\Tenancy\Http\Middleware\RequirePermission;
use Modules\Tenancy\Http\Middleware\ResolveTenant;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api/v1',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'active' => EnsureUserIsActive::class,
            'admin' => EnsurePlatformAdmin::class,
            'tenant' => ResolveTenant::class,
            'tenant.active' => EnsureRestaurantActive::class,
            'permission' => RequirePermission::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => true);

        $exceptions->render(function (ApiException $e) {
            return response()->json(array_filter([
                'message' => $e->getMessage(),
                'code' => $e->errorCode,
                'errors' => $e->errors,
            ], fn ($value) => $value !== null), $e->status);
        });

        $exceptions->render(function (AuthenticationException $e) {
            return response()->json(['message' => 'يجب تسجيل الدخول أولاً', 'code' => 'UNAUTHENTICATED'], 401);
        });

        $exceptions->render(function (ModelNotFoundException|NotFoundHttpException $e) {
            return response()->json(['message' => 'العنصر غير موجود', 'code' => 'NOT_FOUND'], 404);
        });

        $exceptions->render(function (AccessDeniedHttpException $e) {
            return response()->json(['message' => 'غير مصرح لك بهذا الإجراء', 'code' => 'FORBIDDEN'], 403);
        });

        $exceptions->render(function (TooManyRequestsHttpException $e) {
            return response()->json(['message' => 'محاولات كثيرة، حاول بعد قليل', 'code' => 'TOO_MANY_REQUESTS'], 429, [
                'Retry-After' => $e->getHeaders()['Retry-After'] ?? 60,
            ]);
        });
    })->create();
