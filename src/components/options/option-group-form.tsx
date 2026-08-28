"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { OptionSelectionType, ProductOptionGroup } from "@/lib/types";

export type OptionGroupFormValues = {
  name_ar: string;
  name_en: string;
  selection_type: OptionSelectionType;
  is_required: boolean;
  min_selection: number;
  max_selection: number | null;
  sort_order: number;
};

const EMPTY: OptionGroupFormValues = {
  name_ar: "",
  name_en: "",
  selection_type: "SINGLE",
  is_required: false,
  min_selection: 0,
  max_selection: 1,
  sort_order: 0,
};

function fromGroup(group?: ProductOptionGroup | null): OptionGroupFormValues {
  if (!group) return EMPTY;
  return {
    name_ar: group.name_ar,
    name_en: group.name_en ?? "",
    selection_type: group.selection_type,
    is_required: group.is_required,
    min_selection: group.min_selection,
    max_selection: group.max_selection,
    sort_order: group.sort_order,
  };
}

export function OptionGroupForm({
  group,
  loading,
  error,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  group?: ProductOptionGroup | null;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: OptionGroupFormValues) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<OptionGroupFormValues>(() => fromGroup(group));
  const [nameError, setNameError] = useState<string | undefined>();
  const [rangeError, setRangeError] = useState<string | undefined>();

  function update<K extends keyof OptionGroupFormValues>(
    key: K,
    value: OptionGroupFormValues[K]
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSelectionType(value: string) {
    if (value !== "SINGLE" && value !== "MULTIPLE") return;
    setValues((current) => ({
      ...current,
      selection_type: value,
      max_selection:
        value === "SINGLE" ? 1 : current.max_selection === 1 ? 2 : current.max_selection,
    }));
  }

  function handleRequired(checked: boolean) {
    setValues((current) => ({
      ...current,
      is_required: checked,
      min_selection: checked ? Math.max(1, current.min_selection) : current.min_selection,
    }));
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
        if (
          values.max_selection != null &&
          values.max_selection < values.min_selection
        ) {
          setRangeError("الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى");
          return;
        }
        setNameError(undefined);
        setRangeError(undefined);
        void onSubmit({
          ...values,
          name_ar: nameAr,
          name_en: values.name_en.trim(),
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الاسم بالعربي" htmlFor="group_name_ar" required error={nameError}>
          <Input
            id="group_name_ar"
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
        <FormField label="الاسم بالإنجليزية" htmlFor="group_name_en">
          <Input
            id="group_name_en"
            dir="ltr"
            value={values.name_en}
            maxLength={150}
            onChange={(event) => update("name_en", event.target.value)}
          />
        </FormField>
      </div>
      <FormField label="نوع الاختيار" required>
        <RadioGroup
          name="selection_type"
          value={values.selection_type}
          onChange={handleSelectionType}
          options={[
            {
              value: "SINGLE",
              label: "اختيار واحد",
              description: "الزبون يختار خيارًا واحدًا فقط، مثل الحجم.",
            },
            {
              value: "MULTIPLE",
              label: "اختيار متعدد",
              description: "الزبون يمكنه اختيار أكثر من إضافة.",
            },
          ]}
        />
      </FormField>
      <FormField label="إلزامي؟">
        <Switch
          checked={values.is_required}
          onCheckedChange={handleRequired}
          label={values.is_required ? "يجب اختيار خيار واحد على الأقل" : "اختياري"}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="الحد الأدنى" htmlFor="min_selection" error={rangeError}>
          <Input
            id="min_selection"
            type="number"
            dir="ltr"
            min={0}
            value={values.min_selection}
            onChange={(event) => {
              update("min_selection", Math.max(0, Number(event.target.value) || 0));
              if (rangeError) setRangeError(undefined);
            }}
          />
        </FormField>
        <FormField
          label="الحد الأقصى"
          htmlFor="max_selection"
          hint="اتركه فارغًا بلا حد"
        >
          <Input
            id="max_selection"
            type="number"
            dir="ltr"
            min={0}
            value={values.max_selection ?? ""}
            onChange={(event) => {
              const raw = event.target.value;
              update("max_selection", raw === "" ? null : Math.max(0, Number(raw) || 0));
              if (rangeError) setRangeError(undefined);
            }}
          />
        </FormField>
        <FormField label="ترتيب العرض" htmlFor="group_sort_order">
          <Input
            id="group_sort_order"
            type="number"
            dir="ltr"
            min={0}
            value={values.sort_order}
            onChange={(event) => update("sort_order", Number(event.target.value) || 0)}
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
          {submitLabel ?? (group ? "حفظ المجموعة" : "إضافة المجموعة")}
        </Button>
      </div>
    </form>
  );
}
