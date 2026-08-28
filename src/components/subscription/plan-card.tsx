import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckIcon, XIcon } from "@/components/ui/icons";
import type { Plan } from "@/lib/types";

export type BillingInterval = "monthly" | "yearly";

export type PlanFeature = {
  key: string;
  label: string;
  included: boolean;
  value: string;
};

function formatLimit(max: number | null): string {
  if (max == null) return "غير محدود";
  return new Intl.NumberFormat("ar-SY").format(max);
}

export function planPrice(plan: Plan, interval: BillingInterval): number {
  return interval === "yearly" ? plan.price_yearly : plan.price_monthly;
}

export function yearlySavingsPercent(plan: Plan): number | null {
  const yearlyFromMonthly = plan.price_monthly * 12;
  if (yearlyFromMonthly <= 0) return null;
  const saved = yearlyFromMonthly - plan.price_yearly;
  if (saved <= 0) return null;
  return Math.round((saved / yearlyFromMonthly) * 100);
}

export function getPlanFeatures(plan: Plan): PlanFeature[] {
  return [
    {
      key: "menus",
      label: "قوائم الطعام",
      included: plan.max_menus !== 0,
      value: formatLimit(plan.max_menus),
    },
    {
      key: "products",
      label: "المنتجات",
      included: plan.max_products !== 0,
      value: formatLimit(plan.max_products),
    },
    {
      key: "branches",
      label: "الفروع",
      included: plan.max_branches !== 0,
      value: formatLimit(plan.max_branches),
    },
    {
      key: "staff",
      label: "الموظفون",
      included: plan.max_staff !== 0,
      value: formatLimit(plan.max_staff),
    },
    {
      key: "analytics",
      label: "الإحصائيات",
      included: plan.analytics_enabled,
      value: plan.analytics_enabled ? "مضمّنة" : "غير مضمّنة",
    },
    {
      key: "advanced_analytics",
      label: "إحصائيات متقدمة",
      included: plan.advanced_analytics,
      value: plan.advanced_analytics ? "مضمّنة" : "غير مضمّنة",
    },
    {
      key: "custom_domain",
      label: "نطاق مخصص",
      included: plan.custom_domain_enabled,
      value: plan.custom_domain_enabled ? "مضمّن" : "غير مضمّن",
    },
    {
      key: "remove_branding",
      label: "إزالة شعار المنصة",
      included: plan.remove_branding,
      value: plan.remove_branding ? "مضمّنة" : "غير مضمّنة",
    },
  ];
}

export function PlanCard({
  plan,
  interval,
  current,
  featured,
  loading,
  ctaLabel,
  onSelect,
  className,
}: {
  plan: Plan;
  interval: BillingInterval;
  current?: boolean;
  featured?: boolean;
  loading?: boolean;
  ctaLabel?: string;
  onSelect?: (plan: Plan) => void;
  className?: string;
}) {
  const price = planPrice(plan, interval);
  const savings = interval === "yearly" ? yearlySavingsPercent(plan) : null;
  const features = getPlanFeatures(plan);
  const isFree = price <= 0;

  return (
    <Card
      className={cn(
        "flex flex-col",
        featured && "border-teal-700 ring-2 ring-teal-700/20",
        current && "border-teal-600",
        className
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{plan.name}</CardTitle>
          {current ? (
            <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-800">
              خطتك الحالية
            </span>
          ) : featured ? (
            <span className="rounded-full bg-teal-700 px-2.5 py-0.5 text-xs font-medium text-white">
              الأكثر اختيارًا
            </span>
          ) : null}
        </div>
        {plan.description ? <CardDescription>{plan.description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div>
          <p className="text-3xl font-bold text-zinc-900">
            {isFree ? "مجاني" : formatPrice(price, plan.currency)}
          </p>
          {!isFree ? (
            <p className="mt-1 text-sm text-zinc-500">
              {interval === "yearly" ? "سنويًا" : "شهريًا"}
              {interval === "yearly" && plan.price_monthly > 0
                ? ` · ${formatPrice(plan.price_yearly / 12, plan.currency)} / شهر`
                : null}
            </p>
          ) : (
            <p className="mt-1 text-sm text-zinc-500">بدون بطاقة دفع</p>
          )}
          {savings ? (
            <p className="mt-2 text-xs font-medium text-teal-700">وفّر {savings}% عند الدفع السنوي</p>
          ) : null}
        </div>
        <ul className="grid gap-2">
          {features.map((feature) => (
            <li key={feature.key} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                  feature.included ? "bg-teal-50 text-teal-700" : "bg-zinc-100 text-zinc-400"
                )}
              >
                {feature.included ? <CheckIcon className="size-3.5" /> : <XIcon className="size-3.5" />}
              </span>
              <span className={feature.included ? "text-zinc-800" : "text-zinc-400"}>
                {feature.label}
                {feature.included ? <span className="text-zinc-500"> · {feature.value}</span> : null}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={current ? "outline" : featured ? "primary" : "secondary"}
          disabled={current || loading || !plan.is_active}
          loading={loading}
          onClick={() => onSelect?.(plan)}
        >
          {current ? "الخطة الحالية" : ctaLabel ?? (isFree ? "اختيار المجانية" : "اختيار الخطة")}
        </Button>
      </CardFooter>
    </Card>
  );
}
