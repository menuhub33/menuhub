"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { RestaurantUser } from "@/lib/types";

export async function updateRestaurantUserStatus(
  id: string,
  restaurantId: string,
  isActive: boolean
): Promise<ActionResult<RestaurantUser>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف العضوية والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تغيير حالة الأعضاء");
  }

  const { data: current, error: currentError } = await auth.supabase
    .from("restaurant_users")
    .select("user_id")
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .single();

  if (currentError || !current) return fail("العضو غير موجود");
  if (current.user_id === auth.user.id) {
    return fail("لا يمكنك تعطيل عضويتك كمالك");
  }

  const { data, error } = await auth.supabase
    .from("restaurant_users")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as RestaurantUser);
}
