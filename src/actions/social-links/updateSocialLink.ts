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

export type UpdateSocialLinkInput = {
  id: string;
  restaurant_id: string;
  platform?: string;
  url?: string;
  sort_order?: number;
};

export async function updateSocialLink(
  input: UpdateSocialLinkInput
): Promise<ActionResult<SocialLink>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف الرابط والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بتعديل روابط التواصل");

  const payload: Record<string, unknown> = {};
  if (input.platform !== undefined) payload.platform = input.platform.trim();
  if (input.url !== undefined) {
    let platform = input.platform?.trim();
    if (!platform) {
      const { data: current } = await auth.supabase
        .from("social_links")
        .select("platform")
        .eq("id", input.id)
        .maybeSingle();
      platform = (current?.platform as string | undefined) ?? "";
    }
    const url = normalizeSocialUrl(platform, input.url);
    if (!url) {
      return fail(
        platform === "whatsapp" ? "أدخل رقم واتساب صالح" : "الرابط غير صالح"
      );
    }
    payload.url = url;
  }
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;

  const { data, error } = await auth.supabase
    .from("social_links")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  await revalidateRestaurantPublicMenu(auth.supabase, input.restaurant_id);
  return ok(data as SocialLink);
}
