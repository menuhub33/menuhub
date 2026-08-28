"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { ProductOptionGroup } from "@/lib/types";

export type GetOptionGroupInput = {
  id?: string;
  product_id?: string;
};

export async function getOptionGroup(
  input: GetOptionGroupInput
): Promise<ActionResult<ProductOptionGroup | ProductOptionGroup[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("product_option_groups")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as ProductOptionGroup);
  }

  if (!input.product_id) return fail("معرّف المجموعة أو المنتج مطلوب");

  const { data, error } = await auth.supabase
    .from("product_option_groups")
    .select("*")
    .eq("product_id", input.product_id)
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as ProductOptionGroup[]);
}
