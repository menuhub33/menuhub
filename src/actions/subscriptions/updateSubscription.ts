"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Subscription } from "@/lib/types";

export type UpdateSubscriptionInput = {
  id: string;
  restaurant_id: string;
  plan_id?: string;
  auto_renew?: boolean;
  ends_at?: string | null;
};

export async function updateSubscription(
  input: UpdateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف الاشتراك والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تعديل الاشتراك");
  }

  const payload: Record<string, unknown> = {};
  if (input.plan_id !== undefined) payload.plan_id = input.plan_id;
  if (input.auto_renew !== undefined) payload.auto_renew = input.auto_renew;
  if (input.ends_at !== undefined) payload.ends_at = input.ends_at;

  const { data, error } = await auth.supabase
    .from("subscriptions")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Subscription);
}
