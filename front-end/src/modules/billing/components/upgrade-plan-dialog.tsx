"use client";

import { useState } from "react";
import { formatPrice } from "@/core/lib/format";
import { PlanCard, planPrice, type BillingInterval } from "@/modules/billing/components/plan-card";
import { Alert } from "@/core/ui/alert";
import { Button } from "@/core/ui/button";
import { Dialog } from "@/core/ui/dialog";
import type { Plan } from "@/modules/billing/types";

export function UpgradePlanDialog({
  open,
  onOpenChange,
  plans,
  currentPlanId,
  interval = "monthly",
  loading,
  error,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: Plan[];
  currentPlanId?: string;
  interval?: BillingInterval;
  loading?: boolean;
  error?: string | null;
  onConfirm: (plan: Plan, interval: BillingInterval) => void | Promise<void>;
}) {
  const selectable = plans.filter((plan) => plan.is_active && plan.id !== currentPlanId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectable.find((plan) => plan.id === selectedId) ?? selectable[0] ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title="ترقية الخطة"
      description="اختر الخطة ثم أكّد. سيتم احتساب السعر حسب الدورة المحددة."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button
            disabled={!selected}
            loading={loading}
            onClick={() => {
              if (selected) void onConfirm(selected, interval);
            }}
          >
            {selected
              ? `تأكيد ${selected.name} · ${
                  planPrice(selected, interval) <= 0
                    ? "مجاني"
                    : formatPrice(planPrice(selected, interval), selected.currency)
                }`
              : "اختر خطة"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {error ? <Alert variant="error">{error}</Alert> : null}
        {selectable.length === 0 ? (
          <Alert variant="info" title="لا توجد خطط للترقية">
            أنت على أعلى خطة متاحة أو لا توجد خطط نشطة أخرى.
          </Alert>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {selectable.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                interval={interval}
                featured={plan.id === selected?.id}
                ctaLabel={plan.id === selected?.id ? "محددة" : "تحديد"}
                onSelect={() => setSelectedId(plan.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
