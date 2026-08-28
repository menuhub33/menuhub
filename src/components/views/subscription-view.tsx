"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSubscription } from "@/actions/subscriptions/updateSubscription";
import { updateSubscriptionStatus } from "@/actions/subscriptions/updateSubscriptionStatus";
import { PageHeader } from "@/components/layout/page-header";
import { CurrentPlan } from "@/components/subscription/current-plan";
import { PlanComparison } from "@/components/subscription/plan-comparison";
import { UpgradePlanDialog } from "@/components/subscription/upgrade-plan-dialog";
import { PaymentHistory } from "@/components/subscription/payment-history";
import { InvoiceList } from "@/components/subscription/invoice-list";
import { useToast } from "@/components/ui/toast";
import type { Invoice, Payment, Plan, Subscription } from "@/lib/types";

export function SubscriptionView({
  restaurantId,
  subscription,
  plan,
  plans,
  payments,
  invoices,
}: {
  restaurantId: string;
  subscription: Subscription | null;
  plan: Plan | null;
  plans: Plan[];
  payments: Payment[];
  invoices: Invoice[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الاشتراك"
        description="الخطة الحالية، المزايا، والفواتير."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "الاشتراك" }]}
      />
      <CurrentPlan
        plan={plan}
        subscription={subscription}
        canManage
        canCancel
        onUpgrade={() => setOpen(true)}
        onCancel={async () => {
          if (!subscription) return;
          const result = await updateSubscriptionStatus(subscription.id, restaurantId, "CANCELLED");
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم إلغاء الاشتراك", variant: "success" });
            router.refresh();
          }
        }}
      />
      <PlanComparison
        plans={plans}
        currentPlanId={plan?.id}
        onSelect={() => setOpen(true)}
      />
      <PaymentHistory payments={payments} />
      <InvoiceList invoices={invoices} />
      <UpgradePlanDialog
        open={open}
        onOpenChange={setOpen}
        plans={plans}
        currentPlanId={plan?.id}
        onConfirm={async (nextPlan) => {
          if (!subscription) return;
          const result = await updateSubscription({
            id: subscription.id,
            restaurant_id: restaurantId,
            plan_id: nextPlan.id,
          });
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم تحديث الخطة", variant: "success" });
            setOpen(false);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
