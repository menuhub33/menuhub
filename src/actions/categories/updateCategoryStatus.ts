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
import type { Category } from "@/lib/types";

export async function updateCategoryStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<Category>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف التصنيف مطلوب");

  const restaurantId = await getRestaurantIdByCategory(auth.supabase, id);
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
    return fail("غير مصرح لك بتغيير حالة التصنيف");
  }

  const { data, error } = await auth.supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Category);
}
