"use client";

import { FormField } from "@/components/forms/form-field";
import { formatPrice, MENU_CURRENCIES } from "@/components/lib/format";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  contractProfit,
  installmentAmounts,
  netMenuPrice,
  parseBillingInput,
  type DiscountType,
} from "@/lib/menu-billing";

export type BillingFormState = {
  price: string;
  setupCost: string;
  annualRenewal: string;
  discountType: DiscountType;
  discountValue: string;
  installmentsCount: string;
  startsOn: string;
  currency: string;
};

export function emptyBillingForm(): BillingFormState {
  return {
    price: "",
    setupCost: "0",
    annualRenewal: "0",
    discountType: "NONE",
    discountValue: "0",
    installmentsCount: "1",
    startsOn: new Date().toISOString().slice(0, 10),
    currency: "SYP",
  };
}

export function MenuBillingFields({
  value,
  onChange,
  disabled,
}: {
  value: BillingFormState;
  onChange: (value: BillingFormState) => void;
  disabled?: boolean;
}) {
  const parsed = parseBillingInput(value);
  const preview = "value" in parsed ? parsed.value : null;
  const net = preview ? netMenuPrice(preview.price, preview.discountType, preview.discountValue) : null;
  const profit = preview ? contractProfit(preview.price, preview.discountType, preview.discountValue, preview.setupCost) : null;
  const parts = preview && net !== null ? installmentAmounts(net, preview.installmentsCount) : [];

  function update(patch: Partial<BillingFormState>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm font-semibold text-zinc-900">البيانات المالية للمنيو</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="سعر المنيو" htmlFor="billing-price" required>
          <Input
            id="billing-price"
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            disabled={disabled}
            value={value.price}
            onChange={(event) => update({ price: event.target.value })}
          />
        </FormField>
        <FormField label="العملة" htmlFor="billing-currency" required>
          <Select
            id="billing-currency"
            value={value.currency}
            disabled={disabled}
            onChange={(currency) => update({ currency })}
            options={MENU_CURRENCIES.map((item) => ({ value: item.value, label: item.label }))}
          />
        </FormField>
        <FormField
          label="تكلفة الاستضافة / التركيب"
          htmlFor="billing-cost"
          hint="تكلفة المنصة على هذا المنيو، وتُطرح من السعر بعد الحسم"
        >
          <Input
            id="billing-cost"
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            disabled={disabled}
            value={value.setupCost}
            onChange={(event) => update({ setupCost: event.target.value })}
          />
        </FormField>
        <FormField label="التجديد السنوي" htmlFor="billing-renewal" hint="0 إذا لم يكن هناك تجديد">
          <Input
            id="billing-renewal"
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            disabled={disabled}
            value={value.annualRenewal}
            onChange={(event) => update({ annualRenewal: event.target.value })}
          />
        </FormField>
        <FormField label="الحسم" htmlFor="billing-discount-type">
          <Select
            id="billing-discount-type"
            value={value.discountType}
            disabled={disabled}
            onChange={(next) => update({ discountType: next as DiscountType })}
            options={[
              { value: "NONE", label: "بدون حسم" },
              { value: "PERCENT", label: "نسبة مئوية" },
              { value: "AMOUNT", label: "مبلغ ثابت" },
            ]}
          />
        </FormField>
        <FormField label="قيمة الحسم" htmlFor="billing-discount-value">
          <Input
            id="billing-discount-value"
            type="number"
            min="0"
            step="0.01"
            dir="ltr"
            disabled={disabled || value.discountType === "NONE"}
            value={value.discountValue}
            onChange={(event) => update({ discountValue: event.target.value })}
          />
        </FormField>
        <FormField label="التقسيط" htmlFor="billing-installments" hint="1 يعني دفعة واحدة، وحتى 24 قسطاً">
          <Input
            id="billing-installments"
            type="number"
            min="1"
            max="24"
            step="1"
            dir="ltr"
            disabled={disabled}
            value={value.installmentsCount}
            onChange={(event) => update({ installmentsCount: event.target.value })}
          />
        </FormField>
        <FormField label="تاريخ البداية" htmlFor="billing-start">
          <Input
            id="billing-start"
            type="date"
            dir="ltr"
            disabled={disabled}
            value={value.startsOn}
            onChange={(event) => update({ startsOn: event.target.value })}
          />
        </FormField>
      </div>
      {preview && net !== null ? (
        <p className="text-sm text-zinc-600">
          الصافي بعد الحسم {formatPrice(net, preview.currency)}
          {profit !== null ? `، والربح بعد التكلفة ${formatPrice(profit, preview.currency)}` : ""}
          {parts.length > 1
            ? `، ويُقسّط على ${parts.length} دفعات بقيمة ${formatPrice(parts[0], preview.currency)}`
            : "، دفعة واحدة"}
          {preview.annualRenewal > 0
            ? `، والتجديد السنوي ${formatPrice(preview.annualRenewal, preview.currency)}`
            : ""}
          .
        </p>
      ) : value.price.trim() ? (
        <p className="text-sm text-red-600">{"error" in parsed ? parsed.error : ""}</p>
      ) : (
        <p className="text-sm text-zinc-500">أدخل سعر المنيو لعرض الصافي والتقسيط.</p>
      )}
    </div>
  );
}
