"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { SocialLink } from "@/lib/types";

export async function getSocialLink(
  restaurantId: string
): Promise<ActionResult<SocialLink[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض روابط التواصل");

  const { data, error } = await auth.supabase
    .from("social_links")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as SocialLink[]);
}
