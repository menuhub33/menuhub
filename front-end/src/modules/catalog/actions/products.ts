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
  price?: number | null;
  old_price?: number | null;
  cost_price?: number | null;
  currency?: string;
  sort_order?: number;
  is_featured?: boolean;
  stock_quantity?: number | null;
};

export async function createProduct(
  input: CreateProductInput
): Promise<ActionResult<Product>> {
  const nameAr = input.name_ar?.trim();
  if (!input.category_id || !nameAr) return fail("التصنيف والاسم العربي مطلوبان");
  if (input.price == null) return fail("سعر البيع مطلوب");
  if (!Number.isFinite(input.price) || input.price < 0) {
    return fail("السعر يجب أن يكون صفراً أو أكبر");
  }
  if (input.cost_price != null && (!Number.isFinite(input.cost_price) || input.cost_price < 0)) {
    return fail("سعر التكلفة يجب أن يكون صفراً أو أكبر");
  }
  if (input.old_price != null && (input.price == null || input.old_price <= input.price)) {
    return fail("السعر قبل الحسم يجب أن يكون أكبر من السعر الحالي");
  }
  if (
    input.stock_quantity != null &&
    (!Number.isInteger(input.stock_quantity) || input.stock_quantity < 0)
  ) {
    return fail("الكمية يجب أن تكون رقماً صحيحاً من صفر أو أكثر");
  }

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
  price?: number | null;
  old_price?: number | null;
  cost_price?: number | null;
  currency?: string;
  sort_order?: number;
  is_featured?: boolean;
  stock_quantity?: number | null;
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
  if (changes.cost_price != null && (!Number.isFinite(changes.cost_price) || changes.cost_price < 0)) {
    return fail("سعر التكلفة يجب أن يكون صفراً أو أكبر");
  }
  if (changes.price === null || changes.cost_price === null) {
    return fail("سعر البيع وسعر التكلفة مطلوبان");
  }
  if (changes.price != null && (!Number.isFinite(changes.price) || changes.price < 0)) {
    return fail("السعر يجب أن يكون صفراً أو أكبر");
  }
  if (
    changes.old_price != null &&
    changes.price !== undefined &&
    (changes.price == null || changes.old_price <= changes.price)
  ) {
    return fail("السعر قبل الحسم يجب أن يكون أكبر من السعر الحالي");
  }
  if (
    changes.stock_quantity != null &&
    (!Number.isInteger(changes.stock_quantity) || changes.stock_quantity < 0)
  ) {
    return fail("الكمية يجب أن تكون رقماً صحيحاً من صفر أو أكثر");
  }

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Product>(`/restaurants/${restaurantId}/products/${id}`, {
      method: "PATCH",
      body: changes,
    });
  });
}

/** The cost of one product (the catalog listing never carries it). Owners and managers only. */
export async function getProductCost(id: string): Promise<ActionResult<number | null>> {
  if (!id) return fail("معرّف المنتج مطلوب");
  return run(async () => {
    const restaurantId = await requireTenantId();
    const product = await apiData<Product>(`/restaurants/${restaurantId}/products/${id}`);
    return product.cost_price ?? null;
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
