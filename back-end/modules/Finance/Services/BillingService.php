<?php

namespace Modules\Finance\Services;

use Illuminate\Support\Facades\DB;
use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Models\MenuInstallment;
use Modules\Finance\Support\BillingCalculator as Calc;
use Modules\Shared\Enums\DiscountType;
use Modules\Shared\Enums\InstallmentKind;
use Modules\Shared\Enums\InstallmentStatus;
use Modules\Shared\Exceptions\ApiException;
use Modules\Tenancy\Models\Restaurant;

class BillingService
{
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

            if ($existing && $this->hasPaidInstallment($existing)) {
                throw new ApiException('لا يمكن تعديل السعر أو الأقساط بعد تسجيل دفعة.', 422);
            }

            $type = DiscountType::from($input['discount_type']);
            $price = Calc::round((float) $input['price']);
            $annualRenewal = Calc::round((float) ($input['annual_renewal'] ?? 0));
            $startsOn = (string) $input['starts_on'];
            $count = (int) ($input['installments_count'] ?? 1);
            $nextRenewal = $annualRenewal > 0 ? Calc::addMonths($startsOn, 12) : null;

            $billing = $existing ?? new MenuBilling(['restaurant_id' => $restaurant->id]);
            $billing->fill([
                'price' => $price,
                'setup_cost' => Calc::round((float) ($input['setup_cost'] ?? 0)),
                'annual_renewal' => $annualRenewal,
                'discount_type' => $type,
                'discount_value' => $type === DiscountType::None ? 0 : Calc::round((float) ($input['discount_value'] ?? 0)),
                'installments_count' => $count,
                'currency' => strtoupper((string) ($input['currency'] ?? 'SYP')),
                'starts_on' => $startsOn,
                'next_renewal_on' => $nextRenewal,
                'notes' => isset($input['notes']) ? (trim($input['notes']) ?: null) : null,
            ])->save();

            $restaurant->forceFill(['currency' => $billing->currency])->save();

            // Regenerate the pending regular installments.
            MenuInstallment::query()->where('billing_id', $billing->id)
                ->where('kind', InstallmentKind::Installment->value)
                ->where('status', InstallmentStatus::Pending->value)->delete();

            $net = Calc::net($price, $type, (float) $billing->discount_value);
            foreach (Calc::installmentAmounts($net, $count) as $i => $amount) {
                MenuInstallment::query()->create([
                    'billing_id' => $billing->id,
                    'restaurant_id' => $restaurant->id,
                    'kind' => InstallmentKind::Installment,
                    'sequence' => $i + 1,
                    'amount' => $amount,
                    'due_on' => Calc::addMonths($startsOn, $i),
                    'status' => InstallmentStatus::Pending,
                ]);
            }

            $this->syncRenewal($billing, $annualRenewal, $nextRenewal);

            return $billing->refresh()->load('installments');
        });
    }

    /** Marks an installment paid/unpaid; paying a renewal rolls the next one forward. */
    public function setPaid(MenuInstallment $installment, bool $paid): MenuInstallment
    {
        return DB::transaction(function () use ($installment, $paid) {
            $installment->forceFill([
                'status' => $paid ? InstallmentStatus::Paid : InstallmentStatus::Pending,
                'paid_at' => $paid ? now() : null,
            ])->save();

            if ($paid && $installment->kind === InstallmentKind::Renewal) {
                $nextDue = Calc::addMonths($installment->due_on->toDateString(), 12);

                MenuBilling::query()->whereKey($installment->billing_id)->update(['next_renewal_on' => $nextDue]);

                $hasPending = MenuInstallment::query()
                    ->where('billing_id', $installment->billing_id)
                    ->where('kind', InstallmentKind::Renewal->value)
                    ->where('status', InstallmentStatus::Pending->value)
                    ->exists();

                if (! $hasPending) {
                    MenuInstallment::query()->create([
                        'billing_id' => $installment->billing_id,
                        'restaurant_id' => $installment->restaurant_id,
                        'kind' => InstallmentKind::Renewal,
                        'sequence' => $installment->sequence + 1,
                        'amount' => $installment->amount,
                        'due_on' => $nextDue,
                        'status' => InstallmentStatus::Pending,
                    ]);
                }
            }

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

    private function syncRenewal(MenuBilling $billing, float $annualRenewal, ?string $nextRenewal): void
    {
        $renewals = MenuInstallment::query()
            ->where('billing_id', $billing->id)
            ->where('kind', InstallmentKind::Renewal->value);

        if ($annualRenewal <= 0 || ! $nextRenewal) {
            (clone $renewals)->where('status', InstallmentStatus::Pending->value)->delete();

            return;
        }

        $pending = (clone $renewals)->where('status', InstallmentStatus::Pending->value)->first();

        if ($pending) {
            $pending->update(['amount' => $annualRenewal, 'due_on' => $nextRenewal]);

            return;
        }

        MenuInstallment::query()->create([
            'billing_id' => $billing->id,
            'restaurant_id' => $billing->restaurant_id,
            'kind' => InstallmentKind::Renewal,
            'sequence' => (clone $renewals)->count() + 1,
            'amount' => $annualRenewal,
            'due_on' => $nextRenewal,
            'status' => InstallmentStatus::Pending,
        ]);
    }
}
