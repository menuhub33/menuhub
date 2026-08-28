"use server";

import {
  fail,
  getRestaurantIdByProduct,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { OptionSelectionType, ProductOptionGroup } from "@/lib/types";

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
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const nameAr = input.name_ar?.trim();
  if (!input.product_id || !nameAr) {
    return fail("المنتج والاسم العربي مطلوبان");
  }

  const minSelection = input.min_selection ?? 0;
  if (minSelection < 0) return fail("الحد الأدنى للاختيار غير صالح");
  if (
    input.max_selection != null &&
    input.max_selection < minSelection
  ) {
    return fail("الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى");
  }

  const restaurantId = await getRestaurantIdByProduct(
    auth.supabase,
    input.product_id
  );
  if (!restaurantId) return fail("المنتج غير موجود");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بإنشاء مجموعة خيارات");
  }

  const { data, error } = await auth.supabase
    .from("product_option_groups")
    .insert({
      product_id: input.product_id,
      name_ar: nameAr,
      name_en: input.name_en ?? null,
      selection_type: input.selection_type ?? "SINGLE",
      is_required: input.is_required ?? false,
      min_selection: minSelection,
      max_selection: input.max_selection ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductOptionGroup);
}
