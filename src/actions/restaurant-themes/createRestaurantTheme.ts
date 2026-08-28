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

export type CreateRestaurantThemeInput = {
  restaurant_id: string;
  theme_id?: string | null;
  primary_color?: string;
  secondary_color?: string;
  background_color?: string;
  text_color?: string;
  font_family?: string | null;
  custom_css?: string | null;
};

export async function createRestaurantTheme(
  input: CreateRestaurantThemeInput
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
    return fail("غير مصرح لك بإنشاء ثيم المطعم");
  }

  const { data, error } = await auth.supabase
    .from("restaurant_themes")
    .insert({
      restaurant_id: input.restaurant_id,
      theme_id: input.theme_id ?? null,
      primary_color: input.primary_color ?? "#000000",
      secondary_color: input.secondary_color ?? "#FFFFFF",
      background_color: input.background_color ?? "#FFFFFF",
      text_color: input.text_color ?? "#111111",
      font_family: input.font_family ?? null,
      custom_css: input.custom_css ?? null,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as RestaurantTheme);
}
