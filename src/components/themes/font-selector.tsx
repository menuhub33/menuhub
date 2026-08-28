"use client";

import { useId } from "react";
import { FONT_OPTIONS } from "@/components/lib/labels";
import { FormField } from "@/components/forms/form-field";
import { Select } from "@/components/ui/select";

const OPTIONS = [
  { value: "", label: "الخط الافتراضي" },
  ...FONT_OPTIONS.map((font) => ({ value: font.value, label: font.label })),
];

export function FontSelector({
  label = "الخط",
  value,
  onChange,
  hint,
  error,
  disabled,
  id,
  className,
}: {
  label?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <FormField
      label={label}
      htmlFor={selectId}
      hint={hint}
      error={error}
      className={className}
    >
      <Select
        id={selectId}
        value={value ?? ""}
        disabled={disabled}
        invalid={Boolean(error)}
        placeholder="اختر الخط"
        options={OPTIONS}
        onChange={(next) => onChange(next ? next : null)}
      />
    </FormField>
  );
}
