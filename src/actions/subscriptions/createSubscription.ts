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

export type CreateSubscriptionInput = {
  restaurant_id: string;
  plan_id: string;
  trial_days?: number;
};

export async function createSubscription(
  input: CreateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id || !input.plan_id) {
    return fail("المطعم والخطة مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه إنشاء اشتراك");
  }

  const { data: existing } = await auth.supabase
    .from("subscriptions")
    .select("id")
    .eq("restaurant_id", input.restaurant_id)
    .in("status", ["TRIAL", "ACTIVE", "PAST_DUE"])
    .maybeSingle();

  if (existing) return fail("يوجد اشتراك فعّال لهذا المطعم");

  const trialDays = input.trial_days ?? 14;
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  const { data, error } = await auth.supabase
    .from("subscriptions")
    .insert({
      restaurant_id: input.restaurant_id,
      plan_id: input.plan_id,
      status: "TRIAL",
      trial_ends_at: trialEndsAt.toISOString(),
      auto_renew: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Subscription);
}
