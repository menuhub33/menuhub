"use client";

import type { OptionGroupWithOptions, ProductWithRelations } from "@/components/lib/types";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";
import { Dialog } from "@/components/ui/dialog";
import type { Category } from "@/lib/types";

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  optionGroups,
  defaultCurrency,
  defaultCategoryId,
  loading,
  error,
  onSubmit,
  onUploadImage,
  onAddGroup,
  onEditGroup,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductWithRelations | null;
  categories: Category[];
  optionGroups?: OptionGroupWithOptions[];
  defaultCurrency?: string;
  defaultCategoryId?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onUploadImage?: (file: File) => Promise<string>;
  onAddGroup?: () => void;
  onEditGroup?: (group: OptionGroupWithOptions) => void;
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
        optionGroups={optionGroups}
        defaultCurrency={defaultCurrency}
        defaultCategoryId={defaultCategoryId}
        loading={loading}
        error={error}
        onUploadImage={onUploadImage}
        onAddGroup={onAddGroup}
        onEditGroup={onEditGroup}
        onCancel={() => onOpenChange(false)}
        onSubmit={onSubmit}
      />
    </Dialog>
  );
}
