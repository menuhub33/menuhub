"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Menu } from "@/lib/types";

export type UpdateMenuInput = {
  id: string;
  restaurant_id: string;
  name?: string;
  description?: string | null;
  is_default?: boolean;
};

export async function updateMenu(
  input: UpdateMenuInput
): Promise<ActionResult<Menu>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف القائمة والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بتعديل القائمة");
  }

  if (input.is_default) {
    await auth.supabase
      .from("menus")
      .update({ is_default: false })
      .eq("restaurant_id", input.restaurant_id)
      .eq("is_default", true)
      .neq("id", input.id);
  }

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description;
  if (input.is_default !== undefined) payload.is_default = input.is_default;

  const { data, error } = await auth.supabase
    .from("menus")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Menu);
}
