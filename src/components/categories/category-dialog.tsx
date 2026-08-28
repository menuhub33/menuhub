"use client";

import { CategoryForm, type CategoryFormValues } from "@/components/categories/category-form";
import { Dialog } from "@/components/ui/dialog";
import type { Category } from "@/lib/types";

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  loading,
  error,
  onSubmit,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  onUpload?: (file: File) => Promise<string>;
}) {
  const isEdit = Boolean(category);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "تعديل القسم" : "إضافة قسم"}
      description={
        isEdit ? "حدّث اسم القسم أو صورته أو ظهوره في المنيو." : "أضف قسمًا جديدًا لتنظيم المنتجات."
      }
      size="lg"
    >
      <CategoryForm
        key={category?.id ?? "new"}
        category={category}
        loading={loading}
        error={error}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
        onUpload={onUpload}
      />
    </Dialog>
  );
}
