"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { RestaurantTheme } from "@/lib/types";

export async function getRestaurantTheme(
  restaurantId: string
): Promise<ActionResult<RestaurantTheme | null>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض ثيم هذا المطعم");

  const { data, error } = await auth.supabase
    .from("restaurant_themes")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (error) return fail(error.message);
  return ok((data as RestaurantTheme) ?? null);
}
