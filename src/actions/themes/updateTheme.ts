"use server";

import {
  fail,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import { parseStoredImageUrl } from "@/lib/storage";
import type { Theme } from "@/lib/types";

export type UpdateThemeInput = {
  id: string;
  name?: string;
  description?: string | null;
  preview_image_url?: string | null;
  is_premium?: boolean;
};

export async function updateTheme(
  input: UpdateThemeInput
): Promise<ActionResult<Theme>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف القالب مطلوب");

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description;
  if (input.preview_image_url !== undefined) {
    const previewImageUrl = parseStoredImageUrl(input.preview_image_url);
    if (previewImageUrl.error) return fail(previewImageUrl.error);
    payload.preview_image_url = previewImageUrl.url;
  }
  if (input.is_premium !== undefined) payload.is_premium = input.is_premium;

  const { data, error } = await auth.supabase
    .from("themes")
    .update(payload)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Theme);
}
