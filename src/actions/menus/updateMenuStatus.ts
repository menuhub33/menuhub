"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Menu, MenuStatus } from "@/lib/types";

export async function updateMenuStatus(
  id: string,
  restaurantId: string,
  status: MenuStatus
): Promise<ActionResult<Menu>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف القائمة والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بتغيير حالة القائمة");
  }

  const payload: Record<string, unknown> = { status };
  if (status === "PUBLISHED") payload.published_at = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("menus")
    .update(payload)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Menu);
}
