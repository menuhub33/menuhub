"use client";

import { Switch } from "@/components/ui/switch";
import type { ProductStatus } from "@/lib/types";

export function ProductAvailabilityToggle({
  status,
  canEdit,
  disabled,
  onChange,
}: {
  status: ProductStatus;
  canEdit?: boolean;
  disabled?: boolean;
  onChange: (status: "AVAILABLE" | "UNAVAILABLE") => void;
}) {
  const isHidden = status === "HIDDEN";
  const locked = !canEdit || disabled || isHidden;

  return (
    <Switch
      checked={status === "AVAILABLE"}
      disabled={locked}
      label={status === "AVAILABLE" ? "متوفر" : "غير متوفر"}
      onCheckedChange={(checked) => {
        if (locked) return;
        onChange(checked ? "AVAILABLE" : "UNAVAILABLE");
      }}
    />
  );
}
