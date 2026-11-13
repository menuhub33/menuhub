"use client";

import { RESTAURANT_ROLE_LABELS } from "@/core/lib/labels";
import { Select } from "@/core/ui/select";
import { usePosMode } from "@/modules/sales/lib/pos-mode";
import type { RestaurantRole } from "@/modules/tenancy/types";

const ROLES: RestaurantRole[] = ["OWNER", "MANAGER", "EDITOR", "CASHIER", "WAITER", "KITCHEN"];

export function StaffRoleSelect({
  value,
  onChange,
  canAssignOwner,
  canManageAll,
  disabled,
  id,
  className,
}: {
  value?: RestaurantRole;
  onChange?: (role: RestaurantRole) => void;
  canAssignOwner?: boolean;
  canManageAll?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const allowOwner = Boolean(canAssignOwner || canManageAll);
  const posMode = usePosMode();
  // Cashier / waiter / kitchen accounts exist only when the restaurant has the matching POS package.
  const unavailable = (role: RestaurantRole) =>
    ((role === "CASHIER" || role === "KITCHEN") && posMode === "OFF") ||
    (role === "WAITER" && posMode !== "CASHIER_WAITER");

  return (
    <Select
      id={id}
      value={value}
      onChange={(next) => onChange?.(next as RestaurantRole)}
      disabled={disabled}
      placeholder="اختر الدور"
      className={className}
      options={ROLES.map((role) => ({
        value: role,
        label: unavailable(role)
          ? `${RESTAURANT_ROLE_LABELS[role]} (غير مفعّل لهذا المحل)`
          : RESTAURANT_ROLE_LABELS[role],
        disabled: (role === "OWNER" && !allowOwner) || unavailable(role),
      }))}
    />
  );
}
