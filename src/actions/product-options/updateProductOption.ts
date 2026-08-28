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
import type { ProductOption } from "@/lib/types";

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
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.option_group_id) {
    return fail("معرّف الخيار والمجموعة مطلوبان");
  }

  const restaurantId = await getRestaurantIdByOptionGroup(
    auth.supabase,
    input.option_group_id
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
    return fail("غير مصرح لك بتعديل الخيار");
  }

  const payload: Record<string, unknown> = {};
  if (input.name_ar !== undefined) payload.name_ar = input.name_ar.trim();
  if (input.name_en !== undefined) payload.name_en = input.name_en;
  if (input.price_delta !== undefined) payload.price_delta = input.price_delta;
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;

  const { data, error } = await auth.supabase
    .from("product_options")
    .update(payload)
    .eq("id", input.id)
    .eq("option_group_id", input.option_group_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductOption);
}
