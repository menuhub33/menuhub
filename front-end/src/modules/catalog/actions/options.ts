"use server";

import { apiData, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import { fail, type ActionResult } from "@/core/api/result";
import type {
  OptionSelectionType,
  ProductOption,
  ProductOptionGroup,
} from "@/modules/catalog/types";

// ----------------------------------------------------------- option groups

export type CreateOptionGroupInput = {
  product_id: string;
  name_ar: string;
  name_en?: string | null;
  selection_type?: OptionSelectionType;
  is_required?: boolean;
  min_selection?: number;
  max_selection?: number | null;
  sort_order?: number;
};

export async function createOptionGroup(
  input: CreateOptionGroupInput
): Promise<ActionResult<ProductOptionGroup>> {
  const nameAr = input.name_ar?.trim();
  if (!input.product_id || !nameAr) return fail("المنتج والاسم العربي مطلوبان");

  return run(async () => {
    const restaurantId = await requireTenantId();
    const { product_id: productId, ...body } = input;
    return apiData<ProductOptionGroup>(
      `/restaurants/${restaurantId}/products/${productId}/option-groups`,
      { method: "POST", body: { ...body, name_ar: nameAr } }
    );
  });
}

export type UpdateOptionGroupInput = {
  id: string;
  name_ar?: string;
  name_en?: string | null;
  selection_type?: OptionSelectionType;
  is_required?: boolean;
  min_selection?: number;
  max_selection?: number | null;
  sort_order?: number;
};

export async function updateOptionGroup(
  input: UpdateOptionGroupInput
): Promise<ActionResult<ProductOptionGroup>> {
  const { id, ...changes } = input;
  if (!id) return fail("معرّف المجموعة مطلوب");
  if (changes.name_ar !== undefined && !changes.name_ar.trim()) {
    return fail("الاسم العربي مطلوب");
  }

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ProductOptionGroup>(`/restaurants/${restaurantId}/option-groups/${id}`, {
      method: "PATCH",
      body: changes,
    });
  });
}

export async function deleteOptionGroup(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف المجموعة مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    await apiData(`/restaurants/${restaurantId}/option-groups/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

// ----------------------------------------------------------------- options

export type CreateProductOptionInput = {
  option_group_id: string;
  name_ar: string;
  name_en?: string | null;
  price_delta?: number;
  sort_order?: number;
};

export async function createProductOption(
  input: CreateProductOptionInput
): Promise<ActionResult<ProductOption>> {
  const nameAr = input.name_ar?.trim();
  if (!input.option_group_id || !nameAr) return fail("المجموعة والاسم العربي مطلوبان");

  return run(async () => {
    const restaurantId = await requireTenantId();
    const { option_group_id: groupId, ...body } = input;
    return apiData<ProductOption>(
      `/restaurants/${restaurantId}/option-groups/${groupId}/options`,
      { method: "POST", body: { ...body, name_ar: nameAr } }
    );
  });
}

export type UpdateProductOptionInput = {
  id: string;
  option_group_id: string;
  name_ar?: string;
  name_en?: string | null;
  price_delta?: number;
  sort_order?: number;
};

export async function updateProductOption(
  input: UpdateProductOptionInput
): Promise<ActionResult<ProductOption>> {
  const { id, option_group_id: _groupId, ...changes } = input;
  void _groupId;
  if (!id) return fail("معرّف الخيار مطلوب");
  if (changes.name_ar !== undefined && !changes.name_ar.trim()) {
    return fail("الاسم العربي مطلوب");
  }

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ProductOption>(`/restaurants/${restaurantId}/options/${id}`, {
      method: "PATCH",
      body: changes,
    });
  });
}

export async function updateProductOptionStatus(
  id: string,
  _optionGroupId: string,
  isActive: boolean
): Promise<ActionResult<ProductOption>> {
  void _optionGroupId;
  if (!id) return fail("معرّف الخيار مطلوب");

  return run(async () => {
    const restaurantId = await requireTenantId();
    return apiData<ProductOption>(`/restaurants/${restaurantId}/options/${id}`, {
      method: "PATCH",
      body: { is_active: isActive },
    });
  });
}
