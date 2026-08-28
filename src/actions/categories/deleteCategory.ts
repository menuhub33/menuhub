"use server";

import {
  fail,
  getRestaurantIdByCategory,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";

export async function deleteCategory(
  id: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف القسم مطلوب");

  const restaurantId = await getRestaurantIdByCategory(auth.supabase, id);
  if (!restaurantId) return fail("القسم غير موجود");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بحذف القسم");
  }

  const { error } = await auth.supabase.from("categories").delete().eq("id", id);
  if (error) return fail(error.message);
  return ok({ success: true });
}
