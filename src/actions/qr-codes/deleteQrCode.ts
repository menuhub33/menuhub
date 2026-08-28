"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";

export async function deleteQrCode(
  id: string,
  restaurantId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف رمز QR والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بحذف رمز QR");

  const { error } = await auth.supabase
    .from("qr_codes")
    .delete()
    .eq("id", id)
    .eq("restaurant_id", restaurantId);

  if (error) return fail(error.message);
  return ok({ success: true });
}
