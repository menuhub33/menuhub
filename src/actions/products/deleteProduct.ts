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
import { releaseStoredImages } from "@/lib/stored-images";

export async function deleteProduct(
  id: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف المنتج مطلوب");

  const restaurantId = await getRestaurantIdByProduct(auth.supabase, id);
  if (!restaurantId) return fail("المنتج غير موجود");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بحذف المنتج");
  }

  const { data: images } = await auth.supabase
    .from("product_images")
    .select("image_url")
    .eq("product_id", id);

  const { error } = await auth.supabase.from("products").delete().eq("id", id);
  if (error) return fail(error.message);
  await releaseStoredImages(
    auth.supabase,
    (images ?? []).map((image) => image.image_url)
  );
  return ok({ success: true });
}
