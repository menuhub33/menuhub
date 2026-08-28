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

export type AddRestaurantUserInput = {
  restaurant_id: string;
  user_id: string;
  role?: RestaurantRole;
};

export async function addRestaurantUser(
  input: AddRestaurantUserInput
): Promise<ActionResult<RestaurantUser>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id || !input.user_id) {
    return fail("معرّف المطعم والمستخدم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه إضافة أعضاء");
  }

  if (input.user_id === auth.user.id) {
    return fail("لا يمكن إضافة نفسك مرة أخرى");
  }

  const role = input.role ?? "EDITOR";

  const { data, error } = await auth.supabase
    .from("restaurant_users")
    .insert({
      restaurant_id: input.restaurant_id,
      user_id: input.user_id,
      role,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as RestaurantUser);
}
