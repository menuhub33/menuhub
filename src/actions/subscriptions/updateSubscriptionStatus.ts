"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Subscription, SubscriptionStatus } from "@/lib/types";

export async function updateSubscriptionStatus(
  id: string,
  restaurantId: string,
  status: SubscriptionStatus
): Promise<ActionResult<Subscription>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف الاشتراك والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تغيير حالة الاشتراك");
  }

  const { data, error } = await auth.supabase
    .from("subscriptions")
    .update({ status })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Subscription);
}
