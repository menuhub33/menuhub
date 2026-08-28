"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPlan } from "@/actions/plans/createPlan";
import { updatePlanStatus } from "@/actions/plans/updatePlanStatus";
import { PageHeader } from "@/components/layout/page-header";
import { PlanCard } from "@/components/subscription/plan-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/ui/toast";
import type { Plan } from "@/lib/types";

export function AdminPlansView({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("0");

  return (
    <div className="grid gap-6">
      <PageHeader title="الخطط" />
      <form
        className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await createPlan({
            name,
            slug,
            price_monthly: Number(price) || 0,
          });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            setName("");
            setSlug("");
            router.refresh();
          }
        }}
      >
        <FormField label="الاسم">
          <Input value={name} onChange={(event) => setName(event.target.value)} />
        </FormField>
        <FormField label="المعرّف">
          <Input dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} />
        </FormField>
        <FormField label="السعر الشهري">
          <Input type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
        </FormField>
        <div className="flex items-end">
          <Button type="submit">إضافة خطة</Button>
        </div>
      </form>
      <div className="grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="grid gap-2">
            <PlanCard plan={plan} interval="monthly" />
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                await updatePlanStatus(plan.id, !plan.is_active);
                router.refresh();
              }}
            >
              {plan.is_active ? "تعطيل" : "تفعيل"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
