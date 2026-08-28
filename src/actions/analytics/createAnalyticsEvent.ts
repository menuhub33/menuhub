"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { AnalyticsEvent, EventType } from "@/lib/types";

export type CreateAnalyticsEventInput = {
  restaurant_id: string;
  event_type: EventType;
  branch_id?: string | null;
  menu_id?: string | null;
  product_id?: string | null;
  session_id?: string | null;
  visitor_id?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  country?: string | null;
  device_type?: string | null;
  metadata?: Record<string, unknown>;
};

export async function createAnalyticsEvent(
  input: CreateAnalyticsEventInput
): Promise<ActionResult<AnalyticsEvent>> {
  if (!input.restaurant_id || !input.event_type) {
    return fail("المطعم ونوع الحدث مطلوبان");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .insert({
      restaurant_id: input.restaurant_id,
      event_type: input.event_type,
      branch_id: input.branch_id ?? null,
      menu_id: input.menu_id ?? null,
      product_id: input.product_id ?? null,
      session_id: input.session_id ?? null,
      visitor_id: input.visitor_id ?? null,
      user_agent: input.user_agent ?? null,
      referrer: input.referrer ?? null,
      country: input.country ?? null,
      device_type: input.device_type ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as AnalyticsEvent);
}
