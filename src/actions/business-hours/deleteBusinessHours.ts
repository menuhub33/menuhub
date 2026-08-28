"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";

export async function deleteBusinessHours(
  id: string,
  restaurantId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف ساعات العمل والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بحذف ساعات العمل");

  const { error } = await auth.supabase
    .from("business_hours")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) return fail(error.message);
  return ok({ success: true });
}
