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

export async function updateProductOptionStatus(
  id: string,
  optionGroupId: string,
  isActive: boolean
): Promise<ActionResult<ProductOption>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !optionGroupId) return fail("معرّف الخيار والمجموعة مطلوبان");

  const restaurantId = await getRestaurantIdByOptionGroup(
    auth.supabase,
    optionGroupId
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
    return fail("غير مصرح لك بتغيير حالة الخيار");
  }

  const { data, error } = await auth.supabase
    .from("product_options")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("option_group_id", optionGroupId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductOption);
}
