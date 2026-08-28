"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function DeleteProductDialog({
  open,
  onOpenChange,
  productName,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="حذف المنتج"
      description={
        productName
          ? `سيتم حذف «${productName}» من المنيو. لا يمكن التراجع عن هذا الإجراء.`
          : "سيتم حذف المنتج من المنيو. لا يمكن التراجع عن هذا الإجراء."
      }
      confirmLabel="حذف المنتج"
      cancelLabel="إلغاء"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
}
