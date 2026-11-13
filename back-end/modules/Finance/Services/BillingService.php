<?php

namespace Modules\Finance\Services;

use Illuminate\Support\Facades\DB;
use Modules\Billing\Models\Plan;
use Modules\Billing\Services\SubscriptionService;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Models\MenuInstallment;
use Modules\Finance\Support\BillingCalculator as Calc;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Enums\InstallmentKind;
use Modules\Shared\Contracts\PricesPosPackage;
use Modules\Shared\Enums\InstallmentStatus;
use Modules\Shared\Enums\PosMode;
use Modules\Shared\Enums\SubscriptionStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;

class BillingService
{
    public function __construct(private readonly PricesPosPackage $posPricing) {}

    /**
     * Creates or updates the contract and regenerates its pending schedule.
     * Refused once any regular installment has been paid.
     *
     * @param  array<string, mixed>  $input  validated input
     */
    public function save(Restaurant $restaurant, array $input): MenuBilling
    {
        return DB::transaction(function () use ($restaurant, $input) {
            $existing = MenuBilling::query()->where('restaurant_id', $restaurant->id)->first();
            $expired = $existing?->next_renewal_on !== null
                && $existing->next_renewal_on->toDateString() <= now()->toDateString();

            if ($existing && ! $expired && $this->hasPaidInstallment($existing)) {
                throw new ApiException('لا يمكن تعديل السعر أو الأقساط بعد تسجيل دفعة.', 422);
            }

            $plan = $this->pricedPlan($input);
            $posPrice = 0.0;
            if ($plan) {
                // Plan price + the restaurant's optional POS package (priced in /admin/plans).
                $posPrice = $this->posPrice($restaurant, $input, $plan);
                $input['price'] = Calc::round((float) $plan->price_yearly + $posPrice);
                $input['currency'] = $plan->currency;
                $input['setup_cost'] = 0;
                $input['annual_renewal'] = 0;
            }

            $type = DiscountType::from($input['discount_type']);
            $price = Calc::round((float) $input['price']);
            $startsOn = (string) $input['starts_on'];
            $count = (int) ($input['installments_count'] ?? 1);
            $discount = (float) ($input['discount_value'] ?? 0);
            $this->guardAdjustment($type, $discount, $count, $price, $plan !== null);
            $nextRenewal = Calc::addMonths($startsOn, 12);

            $billing = $existing ?? new MenuBilling(['restaurant_id' => $restaurant->id]);
            $notes = $billing->notes;
            if (array_key_exists('notes', $input)) {
                $notes = trim((string) ($input['notes'] ?? '')) ?: null;
            }
            $billing->fill([
                'plan_id' => $plan?->id,
                'price' => $price,
                'pos_price' => $posPrice,
                'setup_cost' => Calc::round((float) ($input['setup_cost'] ?? 0)),
                'annual_renewal' => Calc::round((float) ($input['annual_renewal'] ?? 0)),
                'discount_type' => $type,
                'discount_value' => $type === DiscountType::None ? 0 : Calc::round((float) ($input['discount_value'] ?? 0)),
                'installments_count' => $count,
                'currency' => strtoupper((string) ($input['currency'] ?? 'SYP')),
                'starts_on' => $startsOn,
                'next_renewal_on' => $nextRenewal,
                'notes' => $notes,
            ])->save();

            if (! $plan) {
                $restaurant->forceFill(['currency' => $billing->currency])->save();
            }

            if ($plan) {
                app(SubscriptionService::class)->changePlan($restaurant, $plan, SubscriptionStatus::Active);
            }

            MenuInstallment::query()->where('billing_id', $billing->id)
                ->where('kind', InstallmentKind::Installment->value)
                ->where('status', InstallmentStatus::Pending->value)->delete();
            MenuInstallment::query()->where('billing_id', $billing->id)
                ->where('kind', InstallmentKind::Renewal->value)
                ->where('status', InstallmentStatus::Pending->value)->delete();

            $sequence = (int) MenuInstallment::query()
                ->where('billing_id', $billing->id)
                ->where('kind', InstallmentKind::Installment->value)
                ->max('sequence');

            $net = Calc::net($price, $type, (float) $billing->discount_value);
            foreach (Calc::installmentAmounts($net, $count) as $i => $amount) {
                MenuInstallment::query()->create([
                    'billing_id' => $billing->id,
                    'restaurant_id' => $restaurant->id,
                    'kind' => InstallmentKind::Installment,
                    'sequence' => $sequence + $i + 1,
                    'amount' => $amount,
                    'due_on' => Calc::addMonths($startsOn, $i),
                    'status' => InstallmentStatus::Pending,
                ]);
            }

            $billing->forceFill(['expired_notified_at' => null])->save();

            if ($nextRenewal > now()->toDateString()) {
                app(YearlyMenuSubscription::class)->reopen($restaurant);
            }

            return $billing->refresh()->load('installments');
        });
    }

    /**
     * Yearly price of the restaurant's POS package (0 when OFF). `pos_mode` in the input prices a change
     * that is about to be applied; otherwise the restaurant's current package is used.
     *
     * @param  array<string, mixed>  $input
     */
    private function posPrice(Restaurant $restaurant, array $input, Plan $plan): float
    {
        $mode = isset($input['pos_mode']) ? PosMode::normalize((string) $input['pos_mode']) : $restaurant->pos_mode;
        $priced = $this->posPricing->priceFor($mode);

        if ($priced['amount'] <= 0) {
            return 0.0;
        }

        if (strtoupper($priced['currency']) !== strtoupper($plan->currency)) {
            throw ApiException::invalid(
                "عملة سعر نقطة البيع ({$priced['currency']}) تختلف عن عملة الخطة ({$plan->currency}). عدّل عملة الأسعار من صفحة الخطط.",
                'POS_PRICE_CURRENCY_MISMATCH',
            );
        }

        return Calc::round($priced['amount']);
    }

    /** @param  array<string, mixed>  $input */
    private function pricedPlan(array $input): ?Plan
    {
        if (empty($input['plan_id'])) {
            return null;
        }

        $plan = Plan::query()->whereKey($input['plan_id'])->where('is_active', true)->first();
        if (! $plan) {
            throw ApiException::invalid('الخطة غير متاحة', 'PLAN_UNAVAILABLE');
        }

        return $plan;
    }

    private function guardAdjustment(DiscountType $type, float $discount, int $count, float $price, bool $exclusive): void
    {
        if ($type === DiscountType::Percent && $discount > 100) {
            throw ApiException::invalid('نسبة الخصم لا تتجاوز 100', 'INVALID_DISCOUNT');
        }
        if ($type === DiscountType::Amount && $discount > $price) {
            throw ApiException::invalid('مبلغ الخصم أكبر من سعر المنيو', 'INVALID_DISCOUNT');
        }
        if ($exclusive && $type !== DiscountType::None && $discount > 0 && $count > 1) {
            throw ApiException::invalid('اختر الحسم أو التقسيط، وليس الاثنين معاً', 'BILLING_ADJUSTMENT');
        }
    }

    /** Marks an installment paid or unpaid. A paid year does not renew itself. */
    public function setPaid(MenuInstallment $installment, bool $paid): MenuInstallment
    {
        return DB::transaction(function () use ($installment, $paid) {
            $installment->forceFill([
                'status' => $paid ? InstallmentStatus::Paid : InstallmentStatus::Pending,
                'paid_at' => $paid ? now() : null,
            ])->save();

            return $installment->refresh();
        });
    }

    private function hasPaidInstallment(MenuBilling $billing): bool
    {
        return $billing->installments()
            ->where('kind', InstallmentKind::Installment->value)
            ->where('status', InstallmentStatus::Paid->value)
            ->exists();
    }
}
