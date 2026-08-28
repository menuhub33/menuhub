"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { ProductOption } from "@/lib/types";

export type GetProductOptionInput = {
  id?: string;
  option_group_id?: string;
};

export async function getProductOption(
  input: GetProductOptionInput
): Promise<ActionResult<ProductOption | ProductOption[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("product_options")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as ProductOption);
  }

  if (!input.option_group_id) return fail("معرّف الخيار أو المجموعة مطلوب");

  const { data, error } = await auth.supabase
    .from("product_options")
    .select("*")
    .eq("option_group_id", input.option_group_id)
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as ProductOption[]);
}
