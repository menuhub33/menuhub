"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { BusinessHours } from "@/lib/types";

export type GetBusinessHoursInput = {
  restaurant_id: string;
  branch_id?: string | null;
};

export async function getBusinessHours(
  input: GetBusinessHoursInput
): Promise<ActionResult<BusinessHours[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض ساعات العمل");

  let query = auth.supabase
    .from("business_hours")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("day_of_week", { ascending: true });

  if (input.branch_id) {
    query = query.eq("branch_id", input.branch_id);
  } else if (input.branch_id === null) {
    query = query.is("branch_id", null);
  }

  const { data, error } = await query;
  if (error) return fail(error.message);
  return ok((data ?? []) as BusinessHours[]);
}
