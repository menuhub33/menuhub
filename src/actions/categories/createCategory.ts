"use server";

import {
  fail,
  getRestaurantIdByMenu,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  revalidateRestaurantPublicMenu,
  type ActionResult,
} from "@/lib/action";
import { parseStoredImageUrl } from "@/lib/storage";
import type { Category } from "@/lib/types";

export type CreateCategoryInput = {
  menu_id: string;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
};

export async function createCategory(
  input: CreateCategoryInput
): Promise<ActionResult<Category>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const nameAr = input.name_ar?.trim();
  if (!input.menu_id || !nameAr) return fail("القائمة والاسم العربي مطلوبان");

  const restaurantId = await getRestaurantIdByMenu(auth.supabase, input.menu_id);
  if (!restaurantId) return fail("القائمة غير موجودة");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بإنشاء تصنيف");
  }

  const imageUrl = parseStoredImageUrl(input.image_url);
  if (imageUrl.error) return fail(imageUrl.error);

  const { data, error } = await auth.supabase
    .from("categories")
    .insert({
      menu_id: input.menu_id,
      name_ar: nameAr,
      name_en: input.name_en ?? null,
      description_ar: input.description_ar ?? null,
      description_en: input.description_en ?? null,
      image_url: imageUrl.url,
      sort_order: input.sort_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  await revalidateRestaurantPublicMenu(auth.supabase, restaurantId);
  return ok(data as Category);
}
