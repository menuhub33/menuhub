"use server";

import { createProduct } from "@/actions/products/createProduct";
import { createProductImage } from "@/actions/product-images/createProductImage";
import { getProductImage } from "@/actions/product-images/getProductImage";
import { getProduct } from "@/actions/products/getProduct";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { Product } from "@/lib/types";

export async function duplicateProduct(
  id: string,
  nameAr?: string
): Promise<ActionResult<Product>> {
  const current = await getProduct({ id });
  if (current.error || !current.data || Array.isArray(current.data)) {
    return fail(current.error ?? "المنتج غير موجود");
  }

  const product = current.data;
  const created = await createProduct({
    category_id: product.category_id,
    name_ar: nameAr?.trim() || `${product.name_ar} (نسخة)`,
    name_en: product.name_en,
    description_ar: product.description_ar,
    description_en: product.description_en,
    price: product.price,
    old_price: product.old_price,
    currency: product.currency,
    is_featured: product.is_featured,
  });
  if (created.error || !created.data) return fail(created.error ?? "تعذر نسخ المنتج");

  const images = await getProductImage(id);
  if (images.data) {
    for (const image of images.data) {
      await createProductImage({
        product_id: created.data.id,
        image_url: image.image_url,
        sort_order: image.sort_order,
        is_primary: image.is_primary,
      });
    }
  }

  return ok(created.data);
}
