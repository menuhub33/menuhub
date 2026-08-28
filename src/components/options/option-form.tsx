"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { OptionPriceInput } from "@/components/options/option-price-input";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { ProductOption } from "@/lib/types";

export type OptionFormValues = {
  name_ar: string;
  name_en: string;
  price_delta: number;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: OptionFormValues = {
  name_ar: "",
  name_en: "",
  price_delta: 0,
  is_active: true,
  sort_order: 0,
};

function fromOption(option?: ProductOption | null): OptionFormValues {
  if (!option) return EMPTY;
  return {
    name_ar: option.name_ar,
    name_en: option.name_en ?? "",
    price_delta: option.price_delta,
    is_active: option.is_active,
    sort_order: option.sort_order,
  };
}

export function OptionForm({
  option,
  currency = "SYP",
  loading,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  option?: ProductOption | null;
  currency?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: OptionFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<OptionFormValues>(() => fromOption(option));
  const [nameError, setNameError] = useState<string | undefined>();

  function update<K extends keyof OptionFormValues>(key: K, value: OptionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const nameAr = values.name_ar.trim();
        if (!nameAr) {
          setNameError("الاسم العربي مطلوب");
          return;
        }
        setNameError(undefined);
        void onSubmit({
          ...values,
          name_ar: nameAr,
          name_en: values.name_en.trim(),
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الاسم بالعربي" htmlFor="option_name_ar" required error={nameError}>
          <Input
            id="option_name_ar"
            value={values.name_ar}
            maxLength={150}
            required
            invalid={Boolean(nameError)}
            onChange={(event) => {
              update("name_ar", event.target.value);
              if (nameError) setNameError(undefined);
            }}
          />
        </FormField>
        <FormField label="الاسم بالإنجليزية" htmlFor="option_name_en">
          <Input
            id="option_name_en"
            dir="ltr"
            value={values.name_en}
            maxLength={150}
            onChange={(event) => update("name_en", event.target.value)}
          />
        </FormField>
      </div>
      <FormField
        label="فرق السعر"
        htmlFor="price_delta"
        hint="يمكن أن يكون صفرًا أو سالبًا للخصم على الخيار"
      >
        <OptionPriceInput
          id="price_delta"
          value={values.price_delta}
          currency={currency}
          disabled={loading}
          onChange={(value) => update("price_delta", value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="ترتيب العرض" htmlFor="option_sort_order">
          <Input
            id="option_sort_order"
            type="number"
            dir="ltr"
            min={0}
            value={values.sort_order}
            onChange={(event) => update("sort_order", Number(event.target.value) || 0)}
          />
        </FormField>
        <FormField label="حالة الخيار">
          <Switch
            checked={values.is_active}
            onCheckedChange={(checked) => update("is_active", checked)}
            label={values.is_active ? "متاح للاختيار" : "غير متاح"}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
            إلغاء
          </Button>
        ) : null}
        <Button type="submit" loading={loading}>
          {submitLabel ?? (option ? "حفظ الخيار" : "إضافة الخيار")}
        </Button>
      </div>
    </form>
  );
}
