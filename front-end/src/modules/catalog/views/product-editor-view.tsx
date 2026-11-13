"use client";

import { useRouter } from "next/navigation";
import { reloadPage } from "@/core/lib/reload";
import { useState } from "react";
import { createProduct } from "@/modules/catalog/actions/products";
import { updateProduct } from "@/modules/catalog/actions/products";
import { updateProductStatus } from "@/modules/catalog/actions/products";
import { createProductImage } from "@/modules/catalog/actions/product-images";
import { deleteProductImage } from "@/modules/catalog/actions/product-images";
import { updateProductImage } from "@/modules/catalog/actions/product-images";
import { uploadImageFile } from "@/modules/media/lib/upload-client";
import { isOpenableImageUrl } from "@/modules/media/lib/storage";
import { PageHeader } from "@/core/components/layout/page-header";
import { ProductForm, type ProductFormValues } from "@/modules/catalog/components/products/product-form";
import { useToast } from "@/core/ui/toast";
import type { CategoryWithProducts, ProductWithRelations } from "@/modules/catalog/types";

function displayPosition(
  categories: CategoryWithProducts[],
  categoryId?: string,
  productId?: string
) {
  const category = categories.find((item) => item.id === categoryId) ?? categories[0];
  const products = [...(category?.products ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at)
  );
  if (!productId) return products.length + 1;
  const index = products.findIndex((item) => item.id === productId);
  return index >= 0 ? index + 1 : products.length + 1;
}

export function ProductEditorView({
  product,
  categories,
  maxImages = 4,
  showStockCount = true,
  canEditCost = false,
}: {
  product?: ProductWithRelations | null;
  categories: CategoryWithProducts[];
  restaurantId: string;
  maxImages?: number;
  showStockCount?: boolean;
  canEditCost?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderPosition = displayPosition(categories, product?.category_id, product?.id);

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
          ...(canEditCost ? { cost_price: values.cost_price } : {}),
          currency: values.currency,
          sort_order: values.sort_order,
          is_featured: values.is_featured,
          stock_quantity: values.stock_quantity,
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
        const removed = await deleteProductImage(existing.id, productId);
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
    reloadPage("/dashboard/menu/products");
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
        canEditCost={canEditCost}
        product={product}
        categories={categories}
        maxImages={maxImages}
        loading={loading}
        error={error}
        showStockCount={showStockCount}
        orderPosition={orderPosition}
        onCancel={() => router.push("/dashboard/menu/products")}
        onSubmit={save}
        onUploadImage={async (file) => {
          const uploaded = await uploadImageFile(file, "products");
          if (uploaded.error || !uploaded.data) throw new Error(uploaded.error ?? "رفع فشل");
          return uploaded.data.url;
        }}
      />
    </div>
  );
}
