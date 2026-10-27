"use server";

import { apiData, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import { fail, type ActionResult } from "@/core/api/result";
import type { ProductImage } from "@/modules/catalog/types";

export type CreateProductImageInput = {
  product_id: string;
  image_url: string;
  sort_order?: number;
  is_primary?: boolean;
};

export async function createProductImage(
  input: CreateProductImageInput
): Promise<ActionResult<ProductImage>> {
  if (!input.product_id) return fail("معرّف المنتج مطلوب");
  if (!input.image_url?.trim()) return fail("رابط الصورة مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    const { product_id: productId, ...body } = input;
    return apiData<ProductImage>(
      `/restaurants/${restaurantId}/products/${productId}/images`,
      { method: "POST", body }
    );
  });
}

export type UpdateProductImageInput = {
  id: string;
  product_id: string;
  image_url?: string;
  sort_order?: number;
  is_primary?: boolean;
};

export async function updateProductImage(
  input: UpdateProductImageInput
): Promise<ActionResult<ProductImage>> {
  const { id, product_id: _productId, ...changes } = input;
  void _productId;
  if (!id) return fail("معرّف الصورة مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ProductImage>(`/restaurants/${restaurantId}/product-images/${id}`, {
      method: "PATCH",
      body: changes,
    });
  });
}

export async function deleteProductImage(
  id: string,
  _productId?: string
): Promise<ActionResult<{ success: true }>> {
  void _productId;
  if (!id) return fail("معرّف الصورة مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    await apiData(`/restaurants/${restaurantId}/product-images/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}
