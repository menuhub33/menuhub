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

export type CreateProductImageInput = {
  product_id: string;
  image_url: string;
  sort_order?: number;
  is_primary?: boolean;
};

export async function createProductImage(
  input: CreateProductImageInput
): Promise<ActionResult<ProductImage>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const imageUrl = parseStoredImageUrl(input.image_url, true);
  if (!input.product_id || imageUrl.error || !imageUrl.url) {
    return fail(imageUrl.error ?? "المنتج ورابط الصورة مطلوبان");
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
    return fail("غير مصرح لك بإضافة صور المنتج");
  }

  if (input.is_primary) {
    await auth.supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", input.product_id)
      .eq("is_primary", true);
  }

  const { data, error } = await auth.supabase
    .from("product_images")
    .insert({
      product_id: input.product_id,
      image_url: imageUrl.url,
      sort_order: input.sort_order ?? 0,
      is_primary: input.is_primary ?? false,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductImage);
}
