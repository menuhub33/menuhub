<?php

namespace Modules\Billing\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Billing\Models\Plan;
use Modules\Billing\Models\Subscription;
use Modules\Shared\Http\Controllers\ApiController;

class PlanController extends ApiController
{
    public function index(): JsonResponse
    {
        return $this->ok(Plan::query()->where('is_active', true)->orderBy('price_monthly')->get());
    }

    public function adminIndex(): JsonResponse
    {
        return $this->ok(Plan::query()->orderBy('price_monthly')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules() + [
            'slug' => ['required', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:plans,slug'],
        ]);

        return $this->created(Plan::query()->create($data)->refresh());
    }

    public function update(Request $request, Plan $plan): JsonResponse
    {
        $data = $request->validate($this->rules(partial: true) + [
            'slug' => ['sometimes', 'string', 'max:100', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', 'unique:plans,slug,'.$plan->id],
        ]);

        $plan->update($data);

        return $this->ok($plan->refresh());
    }

    public function destroy(Plan $plan): JsonResponse
    {
        if ($plan->slug === 'free') {
            return $this->message('لا يمكن حذف الخطة المجانية', 422);
        }

        if (Subscription::query()->where('plan_id', $plan->id)->exists()) {
            return $this->message('لا يمكن حذف خطة مرتبطة باشتراكات. عطّلها بدلاً من ذلك', 422);
        }

        $plan->delete();

        return $this->noContent();
    }

    /** @return array<string, array<int, mixed>> */
    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:1000'],
            'price_monthly' => ['sometimes', 'numeric', 'min:0'],
            'price_yearly' => ['sometimes', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'max_menus' => ['nullable', 'integer', 'min:1'],
            'max_products' => ['nullable', 'integer', 'min:1'],
            'max_branches' => ['nullable', 'integer', 'min:1'],
            'max_staff' => ['nullable', 'integer', 'min:1'],
            'analytics_enabled' => ['sometimes', 'boolean'],
            'custom_domain_enabled' => ['sometimes', 'boolean'],
            'remove_branding' => ['sometimes', 'boolean'],
            'advanced_analytics' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
