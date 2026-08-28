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
import { parseStoredImageUrl } from "@/lib/storage";
import type { ProductImage } from "@/lib/types";

export type UpdateProductImageInput = {
  id: string;
  product_id: string;
  image_url?: string;
  sort_order?: number;
  is_primary?: boolean;
};

export async function updateProductImage(
  input: UpdateProductImageInput
): Promise<ActionResult<ProductImage>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.product_id) {
    return fail("معرّف الصورة والمنتج مطلوبان");
  }

  const restaurantId = await getRestaurantIdByProduct(
    auth.supabase,
    input.product_id
  );
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
    return fail("غير مصرح لك بتعديل صور المنتج");
  }

  if (input.is_primary) {
    await auth.supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", input.product_id)
      .eq("is_primary", true)
      .neq("id", input.id);
  }

  const payload: Record<string, unknown> = {};
  if (input.image_url !== undefined) {
    const imageUrl = parseStoredImageUrl(input.image_url, true);
    if (imageUrl.error || !imageUrl.url) return fail(imageUrl.error ?? "رابط الصورة مطلوب");
    payload.image_url = imageUrl.url;
  }
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
  if (input.is_primary !== undefined) payload.is_primary = input.is_primary;

  const { data, error } = await auth.supabase
    .from("product_images")
    .update(payload)
    .eq("id", input.id)
    .eq("product_id", input.product_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductImage);
}
