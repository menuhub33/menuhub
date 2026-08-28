"use client";

import { RESTAURANT_ROLE_LABELS } from "@/components/lib/labels";
import { Select } from "@/components/ui/select";
import type { RestaurantRole } from "@/lib/types";

const ROLES: RestaurantRole[] = ["OWNER", "MANAGER", "EDITOR"];

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
        label: RESTAURANT_ROLE_LABELS[role],
        disabled: role === "OWNER" && !allowOwner,
      }))}
    />
  );
}
