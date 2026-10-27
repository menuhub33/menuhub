"use client";

import { useId, useState } from "react";
import { cn } from "@/core/lib/cn";
import { EmptyState } from "@/core/components/common/empty-state";
import { FormField } from "@/core/components/forms/form-field";
import { MENU_STATUS_LABELS } from "@/core/lib/labels";
import { Alert } from "@/core/ui/alert";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Select } from "@/core/ui/select";
import { Switch } from "@/core/ui/switch";
import { QrIcon } from "@/core/ui/icons";
import type { Menu } from "@/modules/catalog/types";

export type QrGenerateValues = {
  name: string;
  menu_id: string;
  logo_enabled: boolean;
  format: "PNG" | "SVG";
};

const FORMAT_OPTIONS = [
  { value: "PNG", label: "PNG" },
  { value: "SVG", label: "SVG" },
];

export function QrCodeGenerator({
  menus,
  defaultMenuId,
  loading,
  error,
  onGenerate,
  className,
}: {
  menus: Menu[];
  defaultMenuId?: string;
  loading?: boolean;
  error?: string | null;
  onGenerate: (values: QrGenerateValues) => void;
  className?: string;
}) {
  const nameId = useId();
  const menuId = useId();
  const formatId = useId();
  const logoId = useId();
  const initialMenu = defaultMenuId ?? menus.find((menu) => menu.is_default)?.id ?? menus[0]?.id ?? "";

  const [name, setName] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState(initialMenu);
  const [logoEnabled, setLogoEnabled] = useState(false);
  const [format, setFormat] = useState<"PNG" | "SVG">("PNG");

  if (menus.length === 0) {
    return (
      <EmptyState
        title="لا توجد قوائم"
        description="أنشئ منيو أولًا حتى تتمكن من توليد رمز QR."
        icon={<QrIcon className="size-7" />}
      />
    );
  }

  return (
    <form
      className={cn("grid gap-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const menuIdValue = selectedMenuId || initialMenu;
        if (!name.trim() || !menuIdValue) return;
        onGenerate({
          name: name.trim(),
          menu_id: menuIdValue,
          logo_enabled: logoEnabled,
          format,
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField label="اسم الرمز" htmlFor={nameId} required hint="مثل: المدخل الرئيسي أو طاولة 4">
        <Input
          id={nameId}
          value={name}
          required
          placeholder="المدخل الرئيسي"
          onChange={(event) => setName(event.target.value)}
        />
      </FormField>
      <FormField label="المنيو" htmlFor={menuId} required>
        <Select
          id={menuId}
          value={selectedMenuId || initialMenu}
          options={menus.map((menu) => ({
            value: menu.id,
            label: `${menu.name} — ${MENU_STATUS_LABELS[menu.status]}`,
          }))}
          onChange={setSelectedMenuId}
        />
      </FormField>
      <FormField label="الصيغة" htmlFor={formatId}>
        <Select
          id={formatId}
          value={format}
          options={FORMAT_OPTIONS}
          onChange={(next) => setFormat(next === "SVG" ? "SVG" : "PNG")}
        />
      </FormField>
      <Switch
        id={logoId}
        checked={logoEnabled}
        onCheckedChange={setLogoEnabled}
        label="إظهار شعار المطعم داخل الرمز"
      />
      <div className="flex justify-end">
        <Button type="submit" loading={loading} disabled={!name.trim()}>
          <QrIcon className="size-4" />
          إنشاء الرمز
        </Button>
      </div>
    </form>
  );
}
