"use server";

import {
  fail,
  getRestaurantIdByOptionGroup,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { ProductOption } from "@/lib/types";

export type CreateProductOptionInput = {
  option_group_id: string;
  name_ar: string;
  name_en?: string | null;
  price_delta?: number;
  sort_order?: number;
};

export async function createProductOption(
  input: CreateProductOptionInput
): Promise<ActionResult<ProductOption>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const nameAr = input.name_ar?.trim();
  if (!input.option_group_id || !nameAr) {
    return fail("مجموعة الخيارات والاسم العربي مطلوبان");
  }

  const restaurantId = await getRestaurantIdByOptionGroup(
    auth.supabase,
    input.option_group_id
  );
  if (!restaurantId) return fail("مجموعة الخيارات غير موجودة");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بإنشاء خيار");
  }

  const { data, error } = await auth.supabase
    .from("product_options")
    .insert({
      option_group_id: input.option_group_id,
      name_ar: nameAr,
      name_en: input.name_en ?? null,
      price_delta: input.price_delta ?? 0,
      sort_order: input.sort_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ProductOption);
}
