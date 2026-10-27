"use server";

import { apiData, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import { fail, type ActionResult } from "@/core/api/result";
import type { Category } from "@/modules/catalog/types";

export type CreateCategoryInput = {
  menu_id: string;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
};

export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  const nameAr = input.name_ar?.trim();
  if (!input.menu_id || !nameAr) return fail("القائمة والاسم العربي مطلوبان");

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Category>(`/restaurants/${restaurantId}/categories`, {
      method: "POST",
      body: { ...input, name_ar: nameAr },
    });
  });
}

export type UpdateCategoryInput = {
  id: string;
  name_ar?: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
};

export async function updateCategory(
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  const { id, ...changes } = input;
  if (!id) return fail("معرّف التصنيف مطلوب");
  if (changes.name_ar !== undefined && !changes.name_ar.trim()) {
    return fail("الاسم العربي مطلوب");
  }

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Category>(`/restaurants/${restaurantId}/categories/${id}`, {
      method: "PATCH",
      body: changes,
    });
  });
}

export async function updateCategoryStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<Category>> {
  if (!id) return fail("معرّف التصنيف مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<Category>(`/restaurants/${restaurantId}/categories/${id}/status`, {
      method: "PATCH",
      body: { is_active: isActive },
    });
  });
}

export async function deleteCategory(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف التصنيف مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    await apiData(`/restaurants/${restaurantId}/categories/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

export async function reorderCategories(
  ids: string[]
): Promise<ActionResult<{ success: true }>> {
  if (ids.length === 0) return fail("لا توجد عناصر لإعادة ترتيبها");

  return run(async () => {
    const restaurantId = await requireTenantId();
    await apiData(`/restaurants/${restaurantId}/categories/reorder`, {
      method: "POST",
      body: { items: ids.map((id, index) => ({ id, sort_order: index })) },
    });
    return { success: true as const };
  });
}

export type GetCategoryInput = {
  id?: string;
  menu_id?: string;
};

export async function getCategory(
  input: GetCategoryInput
): Promise<ActionResult<Category | Category[]>> {
  return run(async () => {
    const restaurantId = await requireTenantId();
    if (input.id) {
      return apiData<Category>(`/restaurants/${restaurantId}/categories/${input.id}`);
    }
    return apiData<Category[]>(`/restaurants/${restaurantId}/categories`, {
      query: { menu_id: input.menu_id },
    });
  });
}
