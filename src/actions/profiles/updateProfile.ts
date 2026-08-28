"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Profile } from "@/lib/types";

export type UpdateProfileInput = {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<Profile>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const payload: UpdateProfileInput = {};

  if (input.full_name !== undefined) {
    payload.full_name = input.full_name?.trim() || null;
  }
  if (input.phone !== undefined) {
    payload.phone = input.phone?.trim() || null;
  }
  if (input.avatar_url !== undefined) {
    payload.avatar_url = input.avatar_url;
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(payload)
    .eq("id", auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Profile);
}
