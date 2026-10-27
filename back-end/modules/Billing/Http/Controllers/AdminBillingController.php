<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Modules\Billing\Models\Invoice;
use Modules\Billing\Models\Payment;
use Modules\Billing\Models\Plan;
use Modules\Billing\Models\Subscription;
use Modules\Billing\Services\SubscriptionService;
use Modules\Shared\Enums\PaymentStatus;
use Modules\Shared\Enums\SubscriptionStatus;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;

/**
 * Platform-side billing administration (subscriptions, invoices, payments).
 */
class AdminBillingController extends ApiController
{
    public function __construct(private readonly SubscriptionService $subscriptions) {}

    public function subscriptions(Request $request)
    {
        return Subscription::query()
            ->with(['plan:id,name,slug', 'restaurant:id,name,slug'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->latest('created_at')
            ->paginate($this->perPage());
    }

    public function updateSubscription(Request $request, Subscription $subscription): JsonResponse
    {
        $data = $request->validate([
            'plan_id' => ['sometimes', 'uuid', 'exists:plans,id'],
            'status' => ['sometimes', Rule::enum(SubscriptionStatus::class)],
            'ends_at' => ['nullable', 'date'],
            'trial_ends_at' => ['nullable', 'date'],
            'auto_renew' => ['sometimes', 'boolean'],
        ]);

        $subscription->update($data);

        return $this->ok($subscription->refresh()->load('plan'));
    }

    public function assignPlan(Request $request, Restaurant $restaurant): JsonResponse
    {
        $data = $request->validate(['plan_id' => ['required', 'uuid', 'exists:plans,id']]);

        $subscription = $this->subscriptions->changePlan($restaurant, Plan::query()->findOrFail($data['plan_id']));

        return $this->ok($subscription->load('plan'));
    }

    public function invoices(Request $request)
    {
        return Invoice::query()
            ->with('restaurant:id,name')
            ->when($request->filled('restaurant_id'), fn ($q) => $q->where('restaurant_id', $request->query('restaurant_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->latest('created_at')
            ->paginate($this->perPage());
    }

    public function storeInvoice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'restaurant_id' => ['required', 'uuid', 'exists:restaurants,id'],
            'subscription_id' => ['nullable', 'uuid', 'exists:subscriptions,id'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'discount' => ['sometimes', 'numeric', 'min:0'],
            'tax' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'status' => ['sometimes', Rule::in(Invoice::STATUSES)],
            'due_date' => ['nullable', 'date'],
        ]);

        $data['total'] = max(0, ($data['subtotal']) - ($data['discount'] ?? 0) + ($data['tax'] ?? 0));
        $data['invoice_number'] = 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(5));

        return $this->created(Invoice::query()->create($data)->refresh());
    }

    public function updateInvoice(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(Invoice::STATUSES)],
            'due_date' => ['nullable', 'date'],
        ]);

        if (($data['status'] ?? null) === 'PAID' && ! $invoice->paid_at) {
            $data['paid_at'] = now();
        }

        $invoice->update($data);

        return $this->ok($invoice->refresh());
    }

    public function payments(Request $request)
    {
        return Payment::query()
            ->with('restaurant:id,name')
            ->when($request->filled('restaurant_id'), fn ($q) => $q->where('restaurant_id', $request->query('restaurant_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->latest('created_at')
            ->paginate($this->perPage());
    }

    public function storePayment(Request $request): JsonResponse
    {
        $data = $request->validate([
            'restaurant_id' => ['required', 'uuid', 'exists:restaurants,id'],
            'subscription_id' => ['nullable', 'uuid', 'exists:subscriptions,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'transaction_id' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::enum(PaymentStatus::class)],
        ]);

        if (($data['status'] ?? null) === PaymentStatus::Paid->value) {
            $data['paid_at'] = now();
        }

        return $this->created(Payment::query()->create($data)->refresh());
    }

    public function updatePayment(Request $request, Payment $payment): JsonResponse
    {
        $data = $request->validate(['status' => ['required', Rule::enum(PaymentStatus::class)]]);

        $payment->status = PaymentStatus::from($data['status']);
        $payment->paid_at = $payment->status === PaymentStatus::Paid ? ($payment->paid_at ?? now()) : null;
        $payment->save();

        return $this->ok($payment->refresh());
    }
}
