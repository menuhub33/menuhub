"use client";

import { useEffect, useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";

export function DuplicateProductDialog({
  open,
  onOpenChange,
  product,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Pick<Product, "name_ar"> | null;
  loading?: boolean;
  onConfirm: (name_ar: string) => void | Promise<void>;
}) {
  const defaultName = product?.name_ar ? `${product.name_ar} (نسخة)` : "";
  const [nameAr, setNameAr] = useState(defaultName);

  useEffect(() => {
    if (open) setNameAr(product?.name_ar ? `${product.name_ar} (نسخة)` : "");
  }, [open, product?.name_ar]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="نسخ المنتج"
      description="سيتم إنشاء نسخة جديدة يمكنك تعديلها لاحقًا."
      size="sm"
      footer={
        <>
          <Button variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button loading={loading} onClick={() => void onConfirm(nameAr.trim())}>
            نسخ المنتج
          </Button>
        </>
      }
    >
      <FormField
        label="الاسم الجديد"
        htmlFor="duplicate-name-ar"
        hint="اختياري — يمكنك الإبقاء على الاسم المقترح"
      >
        <Input
          id="duplicate-name-ar"
          value={nameAr}
          onChange={(event) => setNameAr(event.target.value)}
          placeholder="اسم المنتج"
        />
      </FormField>
    </Dialog>
  );
}
