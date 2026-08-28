"use server";

import {
  fail,
  isValidSlug,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import { parseStoredImageUrl } from "@/lib/storage";
import type { Theme } from "@/lib/types";

export type CreateThemeInput = {
  name: string;
  slug: string;
  description?: string | null;
  preview_image_url?: string | null;
  is_premium?: boolean;
};

export async function createTheme(
  input: CreateThemeInput
): Promise<ActionResult<Theme>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const name = input.name?.trim();
  const slug = input.slug?.trim().toLowerCase();
  if (!name || !slug) return fail("اسم القالب والمعرّف مطلوبان");
  if (!isValidSlug(slug)) return fail("صيغة المعرّف غير صحيحة");

  const previewImageUrl = parseStoredImageUrl(input.preview_image_url);
  if (previewImageUrl.error) return fail(previewImageUrl.error);

  const { data, error } = await auth.supabase
    .from("themes")
    .insert({
      name,
      slug,
      description: input.description ?? null,
      preview_image_url: previewImageUrl.url,
      is_premium: input.is_premium ?? false,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Theme);
}
