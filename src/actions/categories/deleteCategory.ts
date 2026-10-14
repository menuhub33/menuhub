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
import { releaseStoredImages } from "@/lib/stored-images";

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

  const imageUrls: string[] = [];
  const { data: category } = await auth.supabase
    .from("categories")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (category?.image_url) imageUrls.push(category.image_url);

  const { data: products } = await auth.supabase
    .from("products")
    .select("id")
    .eq("category_id", id);
  const productIds = (products ?? []).map((product) => product.id);
  if (productIds.length > 0) {
    const { data: images } = await auth.supabase
      .from("product_images")
      .select("image_url")
      .in("product_id", productIds);
    for (const image of images ?? []) imageUrls.push(image.image_url);
  }

  const { error } = await auth.supabase.from("categories").delete().eq("id", id);
  if (error) return fail(error.message);
  await releaseStoredImages(auth.supabase, imageUrls);
  return ok({ success: true });
}
