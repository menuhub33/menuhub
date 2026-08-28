"use server";

import { updateProduct } from "@/actions/products/updateProduct";
import { fail, ok, type ActionResult } from "@/lib/action";

export async function reorderProducts(
  ids: string[]
): Promise<ActionResult<{ success: true }>> {
  if (!ids.length) return fail("قائمة المنتجات مطلوبة");
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    if (!id) continue;
    const result = await updateProduct({ id, sort_order: index });
    if (result.error) return fail(result.error);
  }
  return ok({ success: true });
}
