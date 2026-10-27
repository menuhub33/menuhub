"use client";

import { Switch } from "@/core/ui/switch";
import type { ProductStatus } from "@/modules/catalog/types";

export function ProductVisibilityToggle({
  status,
  canEdit,
  disabled,
  onChange,
}: {
  status: ProductStatus;
  canEdit?: boolean;
  disabled?: boolean;
  onChange: (status: "AVAILABLE" | "HIDDEN") => void;
}) {
  const locked = !canEdit || disabled;
  const visible = status !== "HIDDEN";

  return (
    <Switch
      checked={visible}
      disabled={locked}
      label={visible ? "ظاهر" : "مخفي"}
      onCheckedChange={(checked) => {
        if (locked) return;
        onChange(checked ? "AVAILABLE" : "HIDDEN");
      }}
    />
  );
}
