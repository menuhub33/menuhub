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

export async function deleteProductImage(
  id: string,
  productId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !productId) return fail("معرّف الصورة والمنتج مطلوبان");

  const restaurantId = await getRestaurantIdByProduct(auth.supabase, productId);
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
    return fail("غير مصرح لك بحذف صور المنتج");
  }

  const { error } = await auth.supabase
    .from("product_images")
    .delete()
    .eq("id", id)
    .eq("product_id", productId);

  if (error) return fail(error.message);
  return ok({ success: true });
}
