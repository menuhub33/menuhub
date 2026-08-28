"use client";

import { RESTAURANT_ROLE_LABELS } from "@/components/lib/labels";
import type { StaffMember } from "@/components/lib/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";

export function RemoveStaffDialog({
  open,
  onOpenChange,
  member,
  loading,
  isLastOwner,
  canManageAll,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
  loading?: boolean;
  isLastOwner?: boolean;
  canManageAll?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  if (!member) return null;

  const name = member.profile?.full_name?.trim() || "هذا الموظف";
  const isOwner = member.role === "OWNER";
  const blockedLastOwner = isOwner && Boolean(isLastOwner) && !canManageAll;

  if (blockedLastOwner) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
        size="sm"
        title="تعذر إزالة المالك"
        description={`لا يمكن إزالة ${name} لأنه المالك الوحيد للمطعم. عيّن مالكاً آخر أولاً.`}
        footer={
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            حسناً
          </Button>
        }
      />
    );
  }

  const description = isOwner
    ? `تحذير: ${name} مالك المطعم (${RESTAURANT_ROLE_LABELS.OWNER}). إزالته قد تمنع إدارة المطعم إذا لم يبقَ مالك نشط آخر.`
    : `سيتم إزالة ${name} من فريق المطعم ولن يتمكن من الوصول إلى لوحة التحكم.`;

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isOwner ? "إزالة المالك؟" : "إزالة الموظف"}
      description={description}
      confirmLabel="إزالة"
      cancelLabel="إلغاء"
      variant="danger"
      loading={loading}
      onConfirm={async () => {
        await onConfirm();
        onOpenChange(false);
      }}
    />
  );
}
