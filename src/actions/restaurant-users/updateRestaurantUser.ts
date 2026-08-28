"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { RestaurantRole, RestaurantUser } from "@/lib/types";

export type UpdateRestaurantUserInput = {
  id: string;
  restaurant_id: string;
  role?: RestaurantRole;
};

export async function updateRestaurantUser(
  input: UpdateRestaurantUserInput
): Promise<ActionResult<RestaurantUser>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف العضوية والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تعديل الأعضاء");
  }

  const { data: current, error: currentError } = await auth.supabase
    .from("restaurant_users")
    .select("user_id, role")
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .single();

  if (currentError || !current) return fail("العضو غير موجود");

  if (current.user_id === auth.user.id && input.role && input.role !== "OWNER") {
    return fail("لا يمكنك تغيير دورك كمالك");
  }

  const payload: Record<string, unknown> = {};
  if (input.role !== undefined) payload.role = input.role;

  const { data, error } = await auth.supabase
    .from("restaurant_users")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as RestaurantUser);
}
