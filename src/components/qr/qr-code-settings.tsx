"use client";

import { useId } from "react";
import { cn } from "@/components/lib/cn";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { QrCode } from "@/lib/types";

const FORMAT_OPTIONS = [
  { value: "PNG", label: "PNG" },
  { value: "SVG", label: "SVG" },
];

export type QrCodeSettingsValue = Pick<QrCode, "name" | "logo_enabled" | "format">;

export function QrCodeSettings({
  value,
  onChange,
  onSave,
  saving,
  className,
}: {
  value: QrCodeSettingsValue;
  onChange: (value: QrCodeSettingsValue) => void;
  onSave?: (value: QrCodeSettingsValue) => void;
  saving?: boolean;
  className?: string;
}) {
  const nameId = useId();
  const formatId = useId();
  const logoId = useId();

  function patch(partial: Partial<QrCodeSettingsValue>) {
    onChange({ ...value, ...partial });
  }

  return (
    <form
      className={cn("grid gap-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSave?.(value);
      }}
    >
      <FormField label="اسم الرمز" htmlFor={nameId} required>
        <Input
          id={nameId}
          value={value.name}
          onChange={(event) => patch({ name: event.target.value })}
          placeholder="طاولة 1"
        />
      </FormField>
      <FormField label="الصيغة" htmlFor={formatId}>
        <Select
          id={formatId}
          value={value.format === "SVG" ? "SVG" : "PNG"}
          options={FORMAT_OPTIONS}
          onChange={(format) => patch({ format })}
        />
      </FormField>
      <Switch
        id={logoId}
        checked={value.logo_enabled}
        onCheckedChange={(logo_enabled) => patch({ logo_enabled })}
        label="إظهار شعار المطعم داخل الرمز"
      />
      {onSave ? (
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            حفظ الإعدادات
          </Button>
        </div>
      ) : null}
    </form>
  );
}
