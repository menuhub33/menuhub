"use server";

import { apiData, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import { fail, type ActionResult } from "@/core/api/result";
import type { Product, ProductStatus } from "@/modules/catalog/types";

export type CreateProductInput = {
  category_id: string;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  price: number;
  old_price?: number | null;
  currency?: string;
  sort_order?: number;
  is_featured?: boolean;
};

export async function createProduct(
  input: CreateProductInput
): Promise<ActionResult<Product>> {
  const nameAr = input.name_ar?.trim();
  if (!input.category_id || !nameAr) return fail("التصنيف والاسم العربي مطلوبان");
  if (input.price == null || input.price < 0) return fail("السعر يجب أن يكون صفراً أو أكبر");
  if (input.old_price != null && input.old_price < 0) return fail("السعر السابق غير صالح");

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Product>(`/restaurants/${restaurantId}/products`, {
      method: "POST",
      body: { ...input, name_ar: nameAr, status: "AVAILABLE" },
    });
  });
}

export type UpdateProductInput = {
  id: string;
  category_id?: string;
  name_ar?: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  price?: number;
  old_price?: number | null;
  currency?: string;
  sort_order?: number;
  is_featured?: boolean;
  status?: Product["status"];
};

export async function updateProduct(
  input: UpdateProductInput
): Promise<ActionResult<Product>> {
  const { id, ...changes } = input;
  if (!id) return fail("معرّف المنتج مطلوب");
  if (changes.name_ar !== undefined && !changes.name_ar.trim()) {
    return fail("الاسم العربي مطلوب");
  }
  if (changes.price !== undefined && changes.price < 0) {
    return fail("السعر يجب أن يكون صفراً أو أكبر");
  }

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Product>(`/restaurants/${restaurantId}/products/${id}`, {
      method: "PATCH",
      body: changes,
    });
  });
}

export async function updateProductStatus(
  id: string,
  status: ProductStatus
): Promise<ActionResult<Product>> {
  if (!id) return fail("معرّف المنتج مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Product>(`/restaurants/${restaurantId}/products/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  });
}

export async function deleteProduct(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف المنتج مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    await apiData(`/restaurants/${restaurantId}/products/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

export async function duplicateProduct(
  id: string,
  nameAr?: string
): Promise<ActionResult<Product>> {
  if (!id) return fail("معرّف المنتج مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    const copy = await apiData<Product>(
      `/restaurants/${restaurantId}/products/${id}/duplicate`,
      { method: "POST" }
    );

    const name = nameAr?.trim();
    if (!name) return copy;
    return apiData<Product>(`/restaurants/${restaurantId}/products/${copy.id}`, {
      method: "PATCH",
      body: { name_ar: name },
    });
  });
}

export async function reorderProducts(
  ids: string[]
): Promise<ActionResult<{ success: true }>> {
  if (ids.length === 0) return fail("لا توجد عناصر لإعادة ترتيبها");

  return run(async () => {
    const restaurantId = await requireTenantId();
    await apiData(`/restaurants/${restaurantId}/products/reorder`, {
      method: "POST",
      body: { items: ids.map((id, index) => ({ id, sort_order: index })) },
    });
    return { success: true as const };
  });
}
