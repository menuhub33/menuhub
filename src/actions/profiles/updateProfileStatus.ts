"use server";

import {
  fail,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { Profile } from "@/lib/types";

export async function updateProfileStatus(
  userId: string,
  isActive: boolean
): Promise<ActionResult<Profile>> {
  if (!userId) return fail("معرّف المستخدم مطلوب");

  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const { data, error } = await auth.supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Profile);
}
