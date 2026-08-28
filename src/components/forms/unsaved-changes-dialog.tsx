"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onDiscard,
  onStay,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onStay?: () => void;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="لديك تغييرات غير محفوظة"
      description="إذا غادرت الآن ستفقد التعديلات التي لم تُحفظ."
      confirmLabel="تجاهل التغييرات"
      cancelLabel="البقاء في الصفحة"
      variant="danger"
      onConfirm={() => {
        onDiscard();
        onStay?.();
      }}
    />
  );
}
