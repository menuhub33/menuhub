"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { RestaurantTheme, Theme } from "@/modules/theming/types";

/** The public theme gallery. */
export async function getTheme(): Promise<ActionResult<Theme[]>> {
  return run(() => apiData<Theme[]>("/themes", { auth: false }));
}

export async function getRestaurantTheme(
  restaurantId: string
): Promise<ActionResult<RestaurantTheme | null>> {
  if (!restaurantId) return fail("معرّف المطعم مطلوب");
  return run(() => apiData<RestaurantTheme>(`/restaurants/${restaurantId}/theme`));
}

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
  const { restaurant_id: restaurantId, ...changes } = input;
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  return run(() =>
    apiData<RestaurantTheme>(`/restaurants/${restaurantId}/theme`, {
      method: "PATCH",
      body: changes,
    })
  );
}

/** The API creates the theme row lazily, so creating is the same as updating. */
export type CreateRestaurantThemeInput = UpdateRestaurantThemeInput;

export async function createRestaurantTheme(
  input: CreateRestaurantThemeInput
): Promise<ActionResult<RestaurantTheme>> {
  return updateRestaurantTheme(input);
}
