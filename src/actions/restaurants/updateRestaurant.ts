"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  isSlugReserved,
  isValidSlug,
  ok,
  requireUser,
  revalidateRestaurantPublicMenu,
  type ActionResult,
} from "@/lib/action";
import { parseStoredImageUrl } from "@/lib/storage";
import type { Restaurant } from "@/lib/types";

export type UpdateRestaurantInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  default_language?: string;
  currency?: string;
  menu_status?: Restaurant["menu_status"];
  delivery_enabled?: boolean;
  chatbot_enabled?: boolean;
  chatbot_name?: string | null;
  chatbot_welcome?: string | null;
};

export async function updateRestaurant(
  input: UpdateRestaurantInput
): Promise<ActionResult<Restaurant>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بتعديل هذا المطعم");
  }

  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.slug !== undefined) {
    const slug = input.slug.trim().toLowerCase();
    if (!isValidSlug(slug)) {
      return fail("صيغة الرابط غير صحيحة. استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات");
    }
    if (await isSlugReserved(auth.supabase, slug)) {
      return fail("هذا الرابط محجوز ولا يمكن استخدامه");
    }
    const { data: taken } = await auth.supabase
      .from("restaurants")
      .select("id")
      .eq("slug", slug)
      .neq("id", input.id)
      .maybeSingle();
    if (taken) return fail("هذا الرابط مستخدم لمطعم آخر");
    payload.slug = slug;
  }
  if (input.description !== undefined) payload.description = input.description;
  if (input.phone !== undefined) payload.phone = input.phone;
  if (input.whatsapp !== undefined) payload.whatsapp = input.whatsapp;
  if (input.email !== undefined) payload.email = input.email;
  if (input.logo_url !== undefined) {
    const logoUrl = parseStoredImageUrl(input.logo_url);
    if (logoUrl.error) return fail(logoUrl.error);
    payload.logo_url = logoUrl.url;
  }
  if (input.cover_image_url !== undefined) {
    const coverUrl = parseStoredImageUrl(input.cover_image_url);
    if (coverUrl.error) return fail(coverUrl.error);
    payload.cover_image_url = coverUrl.url;
  }
  if (input.address !== undefined) payload.address = input.address;
  if (input.latitude !== undefined) payload.latitude = input.latitude;
  if (input.longitude !== undefined) payload.longitude = input.longitude;
  if (input.timezone !== undefined) payload.timezone = input.timezone;
  if (input.default_language !== undefined) {
    payload.default_language = input.default_language;
  }
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.menu_status !== undefined) payload.menu_status = input.menu_status;
  if (input.delivery_enabled !== undefined) payload.delivery_enabled = input.delivery_enabled;
  if (input.chatbot_enabled !== undefined) payload.chatbot_enabled = input.chatbot_enabled;
  if (input.chatbot_name !== undefined) payload.chatbot_name = input.chatbot_name;
  if (input.chatbot_welcome !== undefined) payload.chatbot_welcome = input.chatbot_welcome;

  if (payload.name === "") return fail("اسم المطعم مطلوب");

  const omitted: Record<string, unknown> = {};
  let current = payload;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const { data, error } = await auth.supabase
      .from("restaurants")
      .update(current)
      .eq("id", input.id)
      .select()
      .single();

    if (!error && data) {
      await revalidateRestaurantPublicMenu(auth.supabase, input.id);
      return ok({ ...(data as Restaurant), ...omitted } as Restaurant);
    }

    const missing = error?.message.match(/['"]([a-z_]+)['"] column/i)?.[1];
    if (error && missing && missing in current) {
      omitted[missing] = current[missing];
      const next = { ...current };
      delete next[missing];
      current = next;
      continue;
    }
    return fail(error?.message ?? "تعذر حفظ بيانات المطعم");
  }
  return fail("تعذر حفظ بيانات المطعم");
}
