"use client";

import { FormField } from "@/core/components/forms/form-field";
import { formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Select } from "@/core/ui/select";
import {
  installmentAmounts,
  netMenuPrice,
  parseBillingInput,
  type BillingAdjustment,
  type PricedPlan,
} from "@/modules/finance/lib/menu-billing";

export type BillingFormState = {
  planId: string;
  adjustment: BillingAdjustment;
  discountValue: string;
  installmentsCount: string;
  startsOn: string;
};

export function emptyBillingForm(planId = ""): BillingFormState {
  return {
    planId,
    adjustment: "discount",
    discountValue: "0",
    installmentsCount: "2",
    startsOn: new Date().toISOString().slice(0, 10),
  };
}

export function billingFormFromContract(
  contract: {
    plan_id?: string | null;
    price: number;
    currency: string;
    discount_type: "NONE" | "PERCENT" | "AMOUNT";
    discount_value: number;
    installments_count: number;
    starts_on: string;
  },
  plans: PricedPlan[]
): BillingFormState {
  const matched =
    plans.find((plan) => plan.id === contract.plan_id) ??
    plans.find((plan) => plan.currency === contract.currency && plan.price_yearly === contract.price);
  const installment = contract.installments_count > 1;
  let discount = "0";
  if (!installment && contract.discount_type === "PERCENT") {
    discount = String(contract.discount_value);
  } else if (!installment && contract.discount_type === "AMOUNT" && contract.price > 0) {
    discount = String(Math.round((contract.discount_value / contract.price) * 1000) / 10);
  }

  return {
    planId: matched?.id ?? "",
    adjustment: installment ? "installment" : "discount",
    discountValue: discount,
    installmentsCount: String(Math.max(2, contract.installments_count)),
    startsOn: contract.starts_on.slice(0, 10),
  };
}

export function MenuBillingFields({
  value,
  onChange,
  plans,
  disabled,
}: {
  value: BillingFormState;
  onChange: (value: BillingFormState) => void;
  plans: PricedPlan[];
  disabled?: boolean;
}) {
  const parsed = parseBillingInput(value, plans);
  const preview = "value" in parsed ? parsed.value : null;
  const net = preview ? netMenuPrice(preview.price, preview.discountType, preview.discountValue) : null;
  const parts = preview && net !== null ? installmentAmounts(net, preview.installmentsCount) : [];
  const plan = plans.find((item) => item.id === value.planId);

  function update(patch: Partial<BillingFormState>) {
    onChange({ ...value, ...patch });
  }

  if (plans.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
        لا توجد خطط مفعّلة. أضف خطة من صفحة الخطط قبل إنشاء المحل أو العقد.
      </p>
    );
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-900">تكلفة المنيو من الخطة</p>
      <FormField label="الخطة" htmlFor="billing-plan" required>
        <Select
          id="billing-plan"
          value={value.planId}
          disabled={disabled}
          placeholder="اختر الخطة"
          onChange={(planId) => update({ planId })}
          options={plans.map((item) => ({
            value: item.id,
            label: `${item.name} · ${formatPrice(item.price_yearly, item.currency)} سنوياً`,
          }))}
        />
      </FormField>
      <div className="grid gap-2">
        <p className="text-sm font-medium text-zinc-800">التعديل على السعر</p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={value.adjustment === "discount" ? "primary" : "outline"}
            disabled={disabled}
            onClick={() => update({ adjustment: "discount" })}
          >
            حسم
          </Button>
          <Button
            type="button"
            size="sm"
            variant={value.adjustment === "installment" ? "primary" : "outline"}
            disabled={disabled}
            onClick={() => update({ adjustment: "installment" })}
          >
            تقسيط
          </Button>
        </div>
      </div>
      {value.adjustment === "discount" ? (
        <FormField label="نسبة الحسم %" htmlFor="billing-discount" hint="0 يعني السعر الكامل للخطة">
          <Input
            id="billing-discount"
            type="number"
            min="0"
            max="100"
            step="0.01"
            dir="ltr"
            disabled={disabled}
            value={value.discountValue}
            onChange={(event) => update({ discountValue: event.target.value })}
          />
        </FormField>
      ) : (
        <FormField label="عدد الأقساط" htmlFor="billing-installments" hint="من 2 إلى 24 قسطاً على سنة">
          <Input
            id="billing-installments"
            type="number"
            min="2"
            max="24"
            step="1"
            dir="ltr"
            disabled={disabled}
            value={value.installmentsCount}
            onChange={(event) => update({ installmentsCount: event.target.value })}
          />
        </FormField>
      )}
      <FormField label="تاريخ البداية" htmlFor="billing-start" hint="الاشتراك لسنة من هذا التاريخ.">
        <Input
          id="billing-start"
          type="date"
          dir="ltr"
          disabled={disabled}
          value={value.startsOn}
          onChange={(event) => update({ startsOn: event.target.value })}
        />
      </FormField>
      {plan && preview && net !== null ? (
        <p className="text-sm text-zinc-600">
          سعر {plan.name} السنوي {formatPrice(preview.price, preview.currency)}
          {preview.discountType === "PERCENT"
            ? `، بعد حسم ${preview.discountValue}% يصبح ${formatPrice(net, preview.currency)}`
            : `، والصافي ${formatPrice(net, preview.currency)}`}
          {parts.length > 1
            ? `، على ${parts.length} أقساط بقيمة ${formatPrice(parts[0], preview.currency)}`
            : "، دفعة واحدة"}
          .
        </p>
      ) : (
        <p className="text-sm text-red-600">{"error" in parsed ? parsed.error : "اختر الخطة"}</p>
      )}
    </div>
  );
}
