"use client";

import { StaffForm, type StaffFormValues } from "@/components/staff/staff-form";
import { Dialog } from "@/components/ui/dialog";

export function InviteStaffDialog({
  open,
  onOpenChange,
  loading,
  error,
  canAssignOwner,
  canManageAll,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  error?: string | null;
  canAssignOwner?: boolean;
  canManageAll?: boolean;
  onSubmit: (values: StaffFormValues) => void | Promise<void>;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="دعوة موظف"
      description="أدخل بريد الموظف واختر الدور. المخطط يحفظ user_id بعد ربط الحساب."
    >
      <StaffForm
        key={String(open)}
        loading={loading}
        error={error}
        canAssignOwner={canAssignOwner}
        canManageAll={canManageAll}
        submitLabel="إرسال الدعوة"
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}
