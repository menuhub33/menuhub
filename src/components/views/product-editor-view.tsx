"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createProduct } from "@/actions/products/createProduct";
import { updateProduct } from "@/actions/products/updateProduct";
import { updateProductStatus } from "@/actions/products/updateProductStatus";
import { createProductImage } from "@/actions/product-images/createProductImage";
import { deleteProductImage } from "@/actions/product-images/deleteProductImage";
import { updateProductImage } from "@/actions/product-images/updateProductImage";
import { uploadImageFile } from "@/lib/upload-client";
import { isOpenableImageUrl } from "@/lib/storage";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm, type ProductFormValues } from "@/components/products/product-form";
import { OptionDialog } from "@/components/options/option-dialog";
import { createOptionGroup } from "@/actions/product-option-groups/createOptionGroup";
import { updateOptionGroup } from "@/actions/product-option-groups/updateOptionGroup";
import { useToast } from "@/components/ui/toast";
import type { OptionGroupWithOptions, ProductWithRelations } from "@/components/lib/types";
import type { Category } from "@/lib/types";

export function ProductEditorView({
  product,
  categories,
  restaurantId,
}: {
  product?: ProductWithRelations | null;
  categories: Category[];
  restaurantId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroupWithOptions | null>(null);

  async function save(values: ProductFormValues) {
    setLoading(true);
    setError(null);
    const result = product
      ? await updateProduct({
          id: product.id,
          ...values,
          name_en: values.name_en,
          description_ar: values.description_ar,
          description_en: values.description_en,
        })
      : await createProduct({
          category_id: values.category_id,
          name_ar: values.name_ar,
          name_en: values.name_en,
          description_ar: values.description_ar,
          description_en: values.description_en,
          price: values.price,
          old_price: values.old_price,
          currency: values.currency,
          sort_order: values.sort_order,
          is_featured: values.is_featured,
        });
    if (result.error || !result.data) {
      setLoading(false);
      setError(result.error ?? "تعذر حفظ المنتج");
      return;
    }
    if (product) {
      await updateProductStatus(product.id, values.status);
    }

    const productId = result.data.id;
    const persistedIds = new Set((product?.images ?? []).map((image) => image.id));
    const keptIds = new Set<string>();

    for (const image of values.images) {
      if (!isOpenableImageUrl(image.image_url)) continue;

      if (image.id && persistedIds.has(image.id)) {
        keptIds.add(image.id);
        const updated = await updateProductImage({
          id: image.id,
          product_id: productId,
          sort_order: image.sort_order,
          is_primary: image.is_primary,
        });
        if (updated.error) {
          setLoading(false);
          setError(updated.error);
          return;
        }
        continue;
      }

      const created = await createProductImage({
        product_id: productId,
        image_url: image.image_url,
        sort_order: image.sort_order,
        is_primary: image.is_primary,
      });
      if (created.error) {
        setLoading(false);
        setError(created.error);
        return;
      }
    }

    for (const existing of product?.images ?? []) {
      if (!keptIds.has(existing.id)) {
        const removed = await deleteProductImage(existing.id, product.id);
        if (removed.error) {
          setLoading(false);
          setError(removed.error);
          return;
        }
      }
    }
    setLoading(false);
    toast({
      title: product ? "تم حفظ المنتج" : "تم إضافة المنتج بنجاح",
      variant: "success",
    });
    router.push("/dashboard/menu/products");
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={product ? "تعديل المنتج" : "منتج جديد"}
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "المنتجات", href: "/dashboard/menu/products" },
          { label: product ? "تعديل" : "جديد" },
        ]}
      />
      <ProductForm
        product={product}
        categories={categories}
        loading={loading}
        error={error}
        onCancel={() => router.push("/dashboard/menu/products")}
        onSubmit={save}
        onAddGroup={product ? () => setGroupOpen(true) : undefined}
        onEditGroup={
          product
            ? (group) => {
                setEditingGroup(group);
                setGroupOpen(true);
              }
            : undefined
        }
        onUploadImage={async (file) => {
          const uploaded = await uploadImageFile(
            file,
            `restaurants/${restaurantId}/products`
          );
          if (uploaded.error || !uploaded.data) throw new Error(uploaded.error ?? "رفع فشل");
          return uploaded.data.url;
        }}
      />
      <OptionDialog
        mode="group"
        open={groupOpen}
        onOpenChange={(open) => {
          setGroupOpen(open);
          if (!open) setEditingGroup(null);
        }}
        group={editingGroup}
        onSubmit={async (values) => {
          if (!product) return;
          const result = editingGroup
            ? await updateOptionGroup({ id: editingGroup.id, ...values, name_en: values.name_en || null })
            : await createOptionGroup({
                product_id: product.id,
                name_ar: values.name_ar,
                name_en: values.name_en || null,
                selection_type: values.selection_type,
                is_required: values.is_required,
                min_selection: values.min_selection,
                max_selection: values.max_selection,
                sort_order: values.sort_order,
              });
          if (result.error) {
            toast({ title: result.error, variant: "error" });
            return;
          }
          toast({ title: "تم حفظ مجموعة الخيارات", variant: "success" });
          setGroupOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
