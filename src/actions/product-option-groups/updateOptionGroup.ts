"use server";

import {
  fail,
  getRestaurantIdByOptionGroup,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { OptionSelectionType, ProductOptionGroup } from "@/lib/types";

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
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف مجموعة الخيارات مطلوب");

  const restaurantId = await getRestaurantIdByOptionGroup(
    auth.supabase,
    input.id
  );
  if (!restaurantId) return fail("مجموعة الخيارات غير موجودة");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بتعديل مجموعة الخيارات");
  }

  if (input.min_selection != null && input.min_selection < 0) {
    return fail("الحد الأدنى للاختيار غير صالح");
  }
  if (
    input.max_selection != null &&
    input.min_selection != null &&
    input.max_selection < input.min_selection
  ) {
    return fail("الحد الأقصى يجب أن يكون أكبر من أو يساوي الحد الأدنى");
  }

  const payload: Record<string, unknown> = {};
  if (input.name_ar !== undefined) payload.name_ar = input.name_ar.trim();
  if (input.name_en !== undefined) payload.name_en = input.name_en;
  if (input.selection_type !== undefined) {
    payload.selection_type = input.selection_type;
  }
  if (input.is_required !== undefined) payload.is_required = input.is_required;
  if (input.min_selection !== undefined) {
    payload.min_selection = input.min_selection;
  }
  if (input.max_selection !== undefined) {
    payload.max_selection = input.max_selection;
  }
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;

  const { data, error } = await auth.supabase
    .from("product_option_groups")
    .update(payload)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductOptionGroup);
}
