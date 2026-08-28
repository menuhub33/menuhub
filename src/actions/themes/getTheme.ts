"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Theme } from "@/lib/types";

export type GetThemeInput = {
  id?: string;
  slug?: string;
};

export async function getTheme(
  input: GetThemeInput = {}
): Promise<ActionResult<Theme | Theme[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id || input.slug) {
    let query = auth.supabase.from("themes").select("*");
    if (input.id) query = query.eq("id", input.id);
    if (input.slug) query = query.eq("slug", input.slug);

    const { data, error } = await query.single();
    if (error) return fail(error.message);
    return ok(data as Theme);
  }

  const { data, error } = await auth.supabase
    .from("themes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as Theme[]);
}
