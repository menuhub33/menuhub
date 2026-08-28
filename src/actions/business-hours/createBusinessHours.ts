"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { BusinessHours } from "@/lib/types";

export type CreateBusinessHoursInput = {
  restaurant_id: string;
  branch_id?: string | null;
  day_of_week: number;
  open_time?: string | null;
  close_time?: string | null;
  is_closed?: boolean;
};

export async function createBusinessHours(
  input: CreateBusinessHoursInput
): Promise<ActionResult<BusinessHours>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");
  if (input.day_of_week < 0 || input.day_of_week > 6) {
    return fail("يوم الأسبوع يجب أن يكون بين 0 و 6");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بإضافة ساعات العمل");

  const { data, error } = await auth.supabase
    .from("business_hours")
    .insert({
      restaurant_id: input.restaurant_id,
      branch_id: input.branch_id ?? null,
      day_of_week: input.day_of_week,
      open_time: input.open_time ?? null,
      close_time: input.close_time ?? null,
      is_closed: input.is_closed ?? false,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as BusinessHours);
}
