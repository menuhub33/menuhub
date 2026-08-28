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

export async function deleteOptionGroup(
  id: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف مجموعة الخيارات مطلوب");

  const restaurantId = await getRestaurantIdByOptionGroup(auth.supabase, id);
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
    return fail("غير مصرح لك بحذف مجموعة الخيارات");
  }

  const { error } = await auth.supabase
    .from("product_option_groups")
    .delete()
    .eq("id", id);

  if (error) return fail(error.message);
  return ok({ success: true });
}
