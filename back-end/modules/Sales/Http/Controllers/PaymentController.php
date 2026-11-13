<?php

namespace Modules\Sales\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Modules\Orders\Models\Order;
use Modules\Sales\Http\Resources\SalesOrderResource;
use Modules\Sales\Models\OrderPayment;
use Modules\Sales\Services\PaymentService;
use Modules\Sales\Support\BranchScope;
use Modules\Shared\Enums\PaymentMethod;
use Modules\Shared\Exceptions\ApiException;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

class PaymentController extends ApiController
{
    public function __construct(private readonly PaymentService $payments) {}

    public function collect(Request $request, Restaurant $restaurant, Order $sale): JsonResponse
    {
        BranchScope::assertAccessible($sale);

        $data = $request->validate([
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'tendered_amount' => ['nullable', 'numeric', 'gt:0'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = $this->payments->collect($sale, $request->user(), $data + [
            'client_request_id' => $this->idempotencyKey($request),
        ]);

        return $this->respond($sale, $payment);
    }

    public function refund(Request $request, Restaurant $restaurant, Order $sale): JsonResponse
    {
        BranchScope::assertAccessible($sale);

        $data = $request->validate([
            'method' => ['required', Rule::enum(PaymentMethod::class)],
            'amount' => ['nullable', 'numeric', 'gt:0'],
            'reason' => ['required', 'string', 'min:3', 'max:255'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = $this->payments->refund($sale, $request->user(), $data + [
            'client_request_id' => $this->idempotencyKey($request),
        ]);

        return $this->respond($sale, $payment);
    }

    private function respond(Order $sale, OrderPayment $payment): JsonResponse
    {
        $response = $this->ok(
            new SalesOrderResource($sale->refresh()->load(['items', 'payments', 'opener'])),
            $payment->wasRecentlyCreated ? 201 : 200,
        );

        return $payment->wasRecentlyCreated ? $response : $response->header('Idempotent-Replay', 'true');
    }

    private function idempotencyKey(Request $request): string
    {
        $key = (string) $request->header('Idempotency-Key', '');
        if (Validator::make(['key' => $key], ['key' => ['required', 'uuid']])->fails()) {
            throw ApiException::invalid('الترويسة Idempotency-Key (UUID) مطلوبة', 'IDEMPOTENCY_KEY_REQUIRED');
        }

        return strtolower($key);
    }
}
