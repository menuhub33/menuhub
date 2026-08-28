"use server";

import {
  fail,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { Theme } from "@/lib/types";

export async function updateThemeStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<Theme>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف القالب مطلوب");

  const { data, error } = await auth.supabase
    .from("themes")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Theme);
}
