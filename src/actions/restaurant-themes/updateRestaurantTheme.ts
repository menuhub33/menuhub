"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { RestaurantTheme } from "@/lib/types";

export type UpdateRestaurantThemeInput = {
  restaurant_id: string;
  theme_id?: string | null;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string | null;
  custom_css?: string | null;
};

export async function updateRestaurantTheme(
  input: UpdateRestaurantThemeInput
): Promise<ActionResult<RestaurantTheme>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بتعديل ثيم المطعم");
  }

  const payload: Record<string, unknown> = {};
  if (input.theme_id !== undefined) payload.theme_id = input.theme_id;
  if (input.primary_color !== undefined) payload.primary_color = input.primary_color;
  if (input.secondary_color !== undefined) {
    payload.secondary_color = input.secondary_color;
  }
  if (input.background_color !== undefined) {
    payload.background_color = input.background_color;
  }
  if (input.text_color !== undefined) payload.text_color = input.text_color;
  if (input.font_family !== undefined) payload.font_family = input.font_family;
  if (input.custom_css !== undefined) payload.custom_css = input.custom_css;

  const { data, error } = await auth.supabase
    .from("restaurant_themes")
    .update(payload)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as RestaurantTheme);
}
