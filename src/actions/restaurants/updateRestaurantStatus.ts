"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Restaurant, RestaurantStatus } from "@/lib/types";

export async function updateRestaurantStatus(
  restaurantId: string,
  status: RestaurantStatus
): Promise<ActionResult<Restaurant>> {
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("غير مصرح لك بتغيير حالة المطعم");
  }

  const { data, error } = await auth.supabase
    .from("restaurants")
    .update({ status })
    .eq("id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Restaurant);
}
