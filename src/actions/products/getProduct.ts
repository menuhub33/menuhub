"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Product } from "@/lib/types";

export type GetProductInput = {
  id?: string;
  category_id?: string;
};

export async function getProduct(
  input: GetProductInput
): Promise<ActionResult<Product | Product[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("products")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as Product);
  }

  if (!input.category_id) return fail("معرّف المنتج أو التصنيف مطلوب");

  const { data, error } = await auth.supabase
    .from("products")
    .select("*")
    .eq("category_id", input.category_id)
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as Product[]);
}
