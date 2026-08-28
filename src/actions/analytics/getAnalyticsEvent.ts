"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { AnalyticsEvent, EventType } from "@/lib/types";

export type GetAnalyticsEventInput = {
  restaurant_id: string;
  event_type?: EventType;
  menu_id?: string;
  product_id?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export async function getAnalyticsEvent(
  input: GetAnalyticsEventInput
): Promise<ActionResult<AnalyticsEvent[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض التحليلات");

  let query = auth.supabase
    .from("analytics_events")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);

  if (input.event_type) query = query.eq("event_type", input.event_type);
  if (input.menu_id) query = query.eq("menu_id", input.menu_id);
  if (input.product_id) query = query.eq("product_id", input.product_id);
  if (input.from) query = query.gte("created_at", input.from);
  if (input.to) query = query.lte("created_at", input.to);

  const { data, error } = await query;
  if (error) return fail(error.message);
  return ok((data ?? []) as AnalyticsEvent[]);
}
