"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { BusinessHours } from "@/lib/types";

export type UpdateBusinessHoursInput = {
  id: string;
  restaurant_id: string;
  day_of_week?: number;
  open_time?: string | null;
  close_time?: string | null;
  is_closed?: boolean;
};

export async function updateBusinessHours(
  input: UpdateBusinessHoursInput
): Promise<ActionResult<BusinessHours>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف ساعات العمل والمطعم مطلوبان");
  }

  if (
    input.day_of_week !== undefined &&
    (input.day_of_week < 0 || input.day_of_week > 6)
  ) {
    return fail("يوم الأسبوع يجب أن يكون بين 0 و 6");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بتعديل ساعات العمل");

  const payload: Record<string, unknown> = {};
  if (input.day_of_week !== undefined) payload.day_of_week = input.day_of_week;
  if (input.open_time !== undefined) payload.open_time = input.open_time;
  if (input.close_time !== undefined) payload.close_time = input.close_time;
  if (input.is_closed !== undefined) payload.is_closed = input.is_closed;

  const { data, error } = await auth.supabase
    .from("business_hours")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as BusinessHours);
}
