"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Profile } from "@/lib/types";

export async function getProfile(
  userId?: string
): Promise<ActionResult<Profile>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const id = userId ?? auth.user.id;

  const { data, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return fail(error.message);
  return ok(data as Profile);
}
