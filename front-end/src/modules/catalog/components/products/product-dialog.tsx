"use client";

import type { ProductWithRelations } from "@/modules/catalog/types";
import { ProductForm, type ProductFormValues } from "@/modules/catalog/components/products/product-form";
import { Dialog } from "@/core/ui/dialog";
import type { Category } from "@/modules/catalog/types";

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCurrency,
  defaultCategoryId,
  loading,
  error,
  onSubmit,
  onUploadImage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithRelations | null;
  categories: Category[];
  defaultCurrency?: string;
  defaultCategoryId?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const isEdit = Boolean(product);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "تعديل المنتج" : "إضافة منتج"}
      description={isEdit ? "حدّث الاسم والسعر والصور والحالة." : "أدخل بيانات المنتج الجديد."}
      size="lg"
    >
      <ProductForm
        key={product?.id ?? "create"}
        product={product}
        categories={categories}
        defaultCurrency={defaultCurrency}
        defaultCategoryId={defaultCategoryId}
        loading={loading}
        error={error}
        onUploadImage={onUploadImage}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}
