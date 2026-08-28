"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { ProductImage } from "@/lib/types";

export async function getProductImage(
  productId: string
): Promise<ActionResult<ProductImage[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!productId) return fail("معرّف المنتج مطلوب");

  const { data, error } = await auth.supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as ProductImage[]);
}
