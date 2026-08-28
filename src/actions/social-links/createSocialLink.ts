"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  revalidateRestaurantPublicMenu,
  type ActionResult,
} from "@/lib/action";
import { normalizeSocialUrl } from "@/lib/social";
import type { SocialLink } from "@/lib/types";

export type CreateSocialLinkInput = {
  restaurant_id: string;
  platform: string;
  url: string;
  sort_order?: number;
};

export async function createSocialLink(
  input: CreateSocialLinkInput
): Promise<ActionResult<SocialLink>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const platform = input.platform?.trim();
  const url = normalizeSocialUrl(platform, input.url ?? "");
  if (!input.restaurant_id || !platform || !url) {
    return fail(
      platform === "whatsapp"
        ? "أدخل رقم واتساب صالح"
        : "المطعم والمنصة والرابط مطلوبون"
    );
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بإضافة روابط التواصل");

  const { data, error } = await auth.supabase
    .from("social_links")
    .insert({
      restaurant_id: input.restaurant_id,
      platform,
      url,
      sort_order: input.sort_order ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  await revalidateRestaurantPublicMenu(auth.supabase, input.restaurant_id);
  return ok(data as SocialLink);
}
