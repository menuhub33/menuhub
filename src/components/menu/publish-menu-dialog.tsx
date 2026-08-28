"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function PublishMenuDialog({
  open,
  onOpenChange,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="نشر المنيو"
      description="سيظهر المنيو للزبائن عبر الرابط ورمز QR فور النشر."
      size="sm"
      footer={
        <>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button loading={loading} onClick={() => void onConfirm()}>
            نشر الآن
          </Button>
        </>
      }
    >
      <p className="text-sm leading-6 text-zinc-600">
        تأكد من أن الأقسام والمنتجات والأسعار جاهزة. يمكنك إلغاء النشر لاحقًا في أي وقت
        دون حذف المحتوى.
      </p>
    </Dialog>
  );
}
