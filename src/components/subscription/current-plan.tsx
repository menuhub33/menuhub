"use client";

import { ConfirmAction } from "@/components/common/confirm-action";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate, formatPrice } from "@/components/lib/format";
import { getPlanFeatures } from "@/components/subscription/plan-card";
import { SubscriptionExpiryAlert } from "@/components/subscription/subscription-expiry-alert";
import { SubscriptionStatus } from "@/components/subscription/subscription-status";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCardIcon } from "@/components/ui/icons";
import type { Plan, Subscription } from "@/lib/types";

export function CurrentPlan({
  plan,
  subscription,
  canManage,
  canCancel,
  expiryDaysBefore = 7,
  onUpgrade,
  onCancel,
  onRenew,
}: {
  plan?: Plan | null;
  subscription?: Subscription | null;
  canManage?: boolean;
  canCancel?: boolean;
  expiryDaysBefore?: number;
  onUpgrade?: () => void;
  onCancel?: () => void | Promise<void>;
  onRenew?: () => void;
}) {
  if (!plan || !subscription) {
    return (
      <EmptyState
        title="لا توجد خطة حالية"
        description="اختر خطة لبدء نشر المنيو واستخدام ميزات MenuHub."
        icon={<CreditCardIcon className="size-7" />}
        action={
          canManage && onUpgrade ? (
            <Button onClick={onUpgrade}>عرض الخطط</Button>
          ) : undefined
        }
      />
    );
  }

  const price = subscription.status === "TRIAL" ? 0 : plan.price_monthly;
  const cancellable =
    Boolean(canCancel && onCancel) &&
    subscription.status !== "CANCELLED" &&
    subscription.status !== "EXPIRED";

  return (
    <div className="grid gap-4">
      <SubscriptionExpiryAlert subscription={subscription} daysBefore={expiryDaysBefore} />
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            {plan.description ? <CardDescription>{plan.description}</CardDescription> : null}
          </div>
          <SubscriptionStatus status={subscription.status} />
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">السعر الشهري</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {plan.price_monthly <= 0 ? "مجاني" : formatPrice(plan.price_monthly, plan.currency)}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">السعر السنوي</p>
              <p className="mt-1 font-semibold text-zinc-900">
                {plan.price_yearly <= 0 ? "مجاني" : formatPrice(plan.price_yearly, plan.currency)}
              </p>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">تاريخ البدء</p>
              <p className="mt-1 font-semibold text-zinc-900">{formatDate(subscription.starts_at)}</p>
            </div>
            <div className="rounded-2xl bg-zinc-50 px-4 py-3">
              <p className="text-xs text-zinc-500">
                {subscription.trial_ends_at && subscription.status === "TRIAL"
                  ? "نهاية التجربة"
                  : "تاريخ الانتهاء"}
              </p>
              <p className="mt-1 font-semibold text-zinc-900">
                {subscription.status === "TRIAL" && subscription.trial_ends_at
                  ? formatDate(subscription.trial_ends_at)
                  : subscription.ends_at
                    ? formatDate(subscription.ends_at)
                    : "بدون تاريخ انتهاء"}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600">
            التجديد التلقائي:{" "}
            <span className="font-medium text-zinc-900">
              {subscription.auto_renew ? "مفعّل" : "متوقف"}
            </span>
            {price > 0 ? ` · ${formatPrice(price, plan.currency)} كمرجع شهري` : null}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {getPlanFeatures(plan)
              .filter((feature) => feature.included)
              .map((feature) => (
                <li key={feature.key} className="rounded-2xl border border-zinc-100 px-3 py-2 text-sm">
                  <span className="text-zinc-500">{feature.label}</span>
                  <span className="ms-2 font-medium text-zinc-900">{feature.value}</span>
                </li>
              ))}
          </ul>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {onUpgrade ? <Button onClick={onUpgrade}>تغيير الخطة</Button> : null}
              {onRenew && (subscription.status === "EXPIRED" || subscription.status === "CANCELLED") ? (
                <Button variant="secondary" onClick={onRenew}>
                  تجديد الاشتراك
                </Button>
              ) : null}
              {cancellable ? (
                <ConfirmAction
                  title="إلغاء الاشتراك؟"
                  description="سيتوقف التجديد التلقائي. قد تفقد الميزات المدفوعة عند انتهاء الفترة الحالية."
                  confirmLabel="إلغاء الاشتراك"
                  onConfirm={() => onCancel?.()}
                >
                  {(open) => (
                    <Button variant="danger" onClick={open}>
                      إلغاء الاشتراك
                    </Button>
                  )}
                </ConfirmAction>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
