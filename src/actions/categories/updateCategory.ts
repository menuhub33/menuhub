"use server";

import {
  fail,
  getRestaurantIdByCategory,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  revalidateRestaurantPublicMenu,
  type ActionResult,
} from "@/lib/action";
import { parseStoredImageUrl } from "@/lib/storage";
import type { Category } from "@/lib/types";

export type UpdateCategoryInput = {
  id: string;
  name_ar?: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
};

export async function updateCategory(
  input: UpdateCategoryInput
): Promise<ActionResult<Category>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف التصنيف مطلوب");

  const restaurantId = await getRestaurantIdByCategory(auth.supabase, input.id);
  if (!restaurantId) return fail("التصنيف غير موجود");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بتعديل التصنيف");
  }

  const payload: Record<string, unknown> = {};
  if (input.name_ar !== undefined) payload.name_ar = input.name_ar.trim();
  if (input.name_en !== undefined) payload.name_en = input.name_en;
  if (input.description_ar !== undefined) {
    payload.description_ar = input.description_ar;
  }
  if (input.description_en !== undefined) {
    payload.description_en = input.description_en;
  }
  if (input.image_url !== undefined) {
    const imageUrl = parseStoredImageUrl(input.image_url);
    if (imageUrl.error) return fail(imageUrl.error);
    payload.image_url = imageUrl.url;
  }
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;

  const { data, error } = await auth.supabase
    .from("categories")
    .update(payload)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);
  await revalidateRestaurantPublicMenu(auth.supabase, restaurantId);
  return ok(data as Category);
}
