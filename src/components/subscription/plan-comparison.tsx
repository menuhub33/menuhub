"use client";

import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import {
  getPlanFeatures,
  PlanCard,
  planPrice,
  yearlySavingsPercent,
  type BillingInterval,
} from "@/components/subscription/plan-card";
import { Button } from "@/components/ui/button";
import { CheckIcon, XIcon } from "@/components/ui/icons";
import type { Plan } from "@/lib/types";

export function PlanComparison({
  plans,
  currentPlanId,
  featuredPlanId,
  interval: intervalProp,
  onIntervalChange,
  loadingPlanId,
  onSelect,
}: {
  plans: Plan[];
  currentPlanId?: string;
  featuredPlanId?: string;
  interval?: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
  loadingPlanId?: string;
  onSelect?: (plan: Plan, interval: BillingInterval) => void;
}) {
  const [internalInterval, setInternalInterval] = useState<BillingInterval>("monthly");
  const interval = intervalProp ?? internalInterval;

  function changeInterval(next: BillingInterval) {
    if (onIntervalChange) onIntervalChange(next);
    else setInternalInterval(next);
  }

  const visible = plans.filter((plan) => plan.is_active || plan.id === currentPlanId);
  const featureKeys = visible[0] ? getPlanFeatures(visible[0]) : [];

  if (visible.length === 0) {
    return <EmptyState title="لا توجد خطط" description="ستظهر الخطط المتاحة للمقارنة هنا." />;
  }

  return (
    <div className="grid gap-5">
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium",
              interval === "monthly" ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
            )}
            onClick={() => changeInterval("monthly")}
          >
            شهري
          </button>
          <button
            type="button"
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium",
              interval === "yearly" ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
            )}
            onClick={() => changeInterval("yearly")}
          >
            سنوي
          </button>
        </div>
      </div>
      <div className="grid gap-4 md:hidden">
        {visible.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            interval={interval}
            current={plan.id === currentPlanId}
            featured={plan.id === featuredPlanId}
            loading={loadingPlanId === plan.id}
            onSelect={() => onSelect?.(plan, interval)}
          />
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 md:block">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-4 text-start text-xs font-semibold text-zinc-500">الميزة</th>
              {visible.map((plan) => {
                const current = plan.id === currentPlanId;
                const price = planPrice(plan, interval);
                const savings = interval === "yearly" ? yearlySavingsPercent(plan) : null;
                return (
                  <th
                    key={plan.id}
                    className={cn("px-4 py-4 text-start align-bottom", current && "bg-teal-50")}
                  >
                    <p className="text-sm font-semibold text-zinc-900">{plan.name}</p>
                    <p className="mt-1 text-lg font-bold text-zinc-900">
                      {price <= 0 ? "مجاني" : formatPrice(price, plan.currency)}
                    </p>
                    <p className="text-xs font-normal text-zinc-500">
                      {interval === "yearly" ? "سنويًا" : "شهريًا"}
                    </p>
                    {savings ? (
                      <p className="mt-1 text-xs font-medium text-teal-700">وفّر {savings}%</p>
                    ) : null}
                    {current ? (
                      <p className="mt-2 text-xs font-medium text-teal-800">خطتك الحالية</p>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {featureKeys.map((feature) => (
              <tr key={feature.key}>
                <td className="px-4 py-3 font-medium text-zinc-700">{feature.label}</td>
                {visible.map((plan) => {
                  const row = getPlanFeatures(plan).find((item) => item.key === feature.key);
                  const current = plan.id === currentPlanId;
                  return (
                    <td key={plan.id} className={cn("px-4 py-3", current && "bg-teal-50/60")}>
                      {row?.included ? (
                        <span className="inline-flex items-center gap-1.5 text-zinc-800">
                          <CheckIcon className="size-4 text-teal-700" />
                          {row.value}
                        </span>
                      ) : (
                        <XIcon className="size-4 text-zinc-300" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td className="px-4 py-4" />
              {visible.map((plan) => {
                const current = plan.id === currentPlanId;
                return (
                  <td key={plan.id} className={cn("px-4 py-4", current && "bg-teal-50/60")}>
                    <Button
                      className="w-full"
                      variant={current ? "outline" : "primary"}
                      disabled={current || !plan.is_active}
                      loading={loadingPlanId === plan.id}
                      onClick={() => onSelect?.(plan, interval)}
                    >
                      {current ? "الخطة الحالية" : "اختيار"}
                    </Button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
