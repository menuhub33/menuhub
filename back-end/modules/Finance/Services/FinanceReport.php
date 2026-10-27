<?php

namespace Modules\Finance\Services;

use Modules\Finance\Models\MenuBilling;
use Modules\Finance\Support\BillingCalculator as Calc;
use Modules\Shared\Enums\InstallmentKind;
use Modules\Shared\Enums\InstallmentStatus;
use Modules\Tenancy\Models\Restaurant;

class FinanceReport
{
    /**
     * @return array{contracts: list<array<string, mixed>>, restaurants: mixed, summary: array<string, array<string, float>>}
     */
    public function build(): array
    {
        $billings = MenuBilling::query()->with(['installments', 'restaurant:id,name'])->latest('created_at')->get();

        $summary = [];
        $contracts = [];

        foreach ($billings as $billing) {
            $net = Calc::net($billing->price, $billing->discount_type, $billing->discount_value);
            $profit = Calc::round($net - $billing->setup_cost);

            $paid = 0.0;
            $pending = 0.0;
            foreach ($billing->installments as $row) {
                if ($row->kind !== InstallmentKind::Installment) {
                    continue;
                }
                $row->status === InstallmentStatus::Paid ? $paid += $row->amount : $pending += $row->amount;
            }

            $renewalsPaid = (float) $billing->installments
                ->filter(fn ($r) => $r->kind === InstallmentKind::Renewal && $r->status === InstallmentStatus::Paid)
                ->sum('amount');

            $bucket = &$summary[$billing->currency];
            $bucket ??= ['contracts' => 0, 'net' => 0.0, 'profit' => 0.0, 'collected' => 0.0, 'outstanding' => 0.0, 'renewals_collected' => 0.0];
            $bucket['contracts']++;
            $bucket['net'] = Calc::round($bucket['net'] + $net);
            $bucket['profit'] = Calc::round($bucket['profit'] + $profit);
            $bucket['collected'] = Calc::round($bucket['collected'] + $paid);
            $bucket['outstanding'] = Calc::round($bucket['outstanding'] + $pending);
            $bucket['renewals_collected'] = Calc::round($bucket['renewals_collected'] + $renewalsPaid);
            unset($bucket);

            $contracts[] = array_merge($billing->toArray(), [
                'restaurant_name' => $billing->restaurant?->name ?? 'مطعم',
                'net_price' => $net,
                'profit' => $profit,
            ]);
        }

        return [
            'contracts' => $contracts,
            'restaurants' => Restaurant::query()->orderBy('name')->get(['id', 'name']),
            'summary' => $summary,
        ];
    }
}
