"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  revalidateRestaurantPublicMenu,
  type ActionResult,
} from "@/lib/action";
import type { SocialLink } from "@/lib/types";

export async function updateSocialLinkStatus(
  id: string,
  restaurantId: string,
  isActive: boolean
): Promise<ActionResult<SocialLink>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف الرابط والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بتغيير حالة الرابط");

  const { data, error } = await auth.supabase
    .from("social_links")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  await revalidateRestaurantPublicMenu(auth.supabase, restaurantId);
  return ok(data as SocialLink);
}
