"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Category } from "@/lib/types";

export type GetCategoryInput = {
  id?: string;
  menu_id?: string;
};

export async function getCategory(
  input: GetCategoryInput
): Promise<ActionResult<Category | Category[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("categories")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as Category);
  }

  if (!input.menu_id) return fail("معرّف التصنيف أو القائمة مطلوب");

  const { data, error } = await auth.supabase
    .from("categories")
    .select("*")
    .eq("menu_id", input.menu_id)
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as Category[]);
}
