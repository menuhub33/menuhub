<?php

namespace Modules\Finance\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Models\MenuInstallment;
use Modules\Finance\Services\BillingService;
use Modules\Finance\Services\FinanceReport;
use Modules\Finance\Services\YearlyMenuSubscription;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Http\Controllers\ApiController;
use Modules\Tenancy\Models\Restaurant;
use Modules\Tenancy\Support\MallAccess;

class FinanceController extends ApiController
{
    public function __construct(
        private readonly BillingService $billing,
        private readonly FinanceReport $report,
    ) {}

    public function index(Request $request): JsonResponse
    {
        app(YearlyMenuSubscription::class)->closeDue();

        return $this->ok($this->report->build($request->user()));
    }

    public function save(Request $request, Restaurant $restaurant): JsonResponse
    {
        MallAccess::assertRestaurant($request->user(), $restaurant);
        $data = $request->validate([
            'plan_id' => ['nullable', 'uuid', 'exists:plans,id'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'setup_cost' => ['nullable', 'numeric', 'min:0'],
            'annual_renewal' => ['nullable', 'numeric', 'min:0'],
            'discount_type' => ['required', Rule::enum(DiscountType::class)],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'installments_count' => ['nullable', 'integer', 'min:1', 'max:24'],
            'starts_on' => ['required', 'date_format:Y-m-d'],
            'currency' => ['nullable', Rule::in(config('menuhub.currencies'))],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if (empty($data['plan_id']) && ! isset($data['price'])) {
            return response()->json(['message' => 'سعر المنيو أو الخطة مطلوب'], 422);
        }

        $validator = validator($data, []);
        $validator->after(function (Validator $v) use ($data) {
            if (! empty($data['plan_id'])) {
                return;
            }
            $type = $data['discount_type'];
            $value = (float) ($data['discount_value'] ?? 0);

            if ($type === DiscountType::Percent->value && $value > 100) {
                $v->errors()->add('discount_value', 'نسبة الخصم لا تتجاوز 100');
            }
            if ($type === DiscountType::Amount->value && $value > (float) $data['price']) {
                $v->errors()->add('discount_value', 'مبلغ الخصم أكبر من سعر المنيو');
            }
        })->validate();

        return $this->ok($this->billing->save($restaurant, $data));
    }

    public function destroy(Request $request, MenuBilling $billing): JsonResponse
    {
        $billing->loadMissing('restaurant');
        if ($billing->restaurant) {
            MallAccess::assertRestaurant($request->user(), $billing->restaurant);
        }
        $billing->delete();

        return $this->noContent();
    }

    public function setPaid(Request $request, MenuInstallment $installment): JsonResponse
    {
        $installment->loadMissing('billing.restaurant');
        if ($installment->billing?->restaurant) {
            MallAccess::assertRestaurant($request->user(), $installment->billing->restaurant);
        }
        $data = $request->validate(['paid' => ['required', 'boolean']]);

        return $this->ok($this->billing->setPaid($installment, (bool) $data['paid']));
    }
}
