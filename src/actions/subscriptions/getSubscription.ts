"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Subscription } from "@/lib/types";

export async function getSubscription(
  restaurantId: string
): Promise<ActionResult<Subscription | Subscription[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض الاشتراك");

  const { data, error } = await auth.supabase
    .from("subscriptions")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []) as Subscription[]);
}
