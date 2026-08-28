"use server";

import { updateCategory } from "@/actions/categories/updateCategory";
import { fail, ok, type ActionResult } from "@/lib/action";

export async function reorderCategories(
  ids: string[]
): Promise<ActionResult<{ success: true }>> {
  if (!ids.length) return fail("قائمة الأقسام مطلوبة");
  for (let index = 0; index < ids.length; index += 1) {
    const id = ids[index];
    if (!id) continue;
    const result = await updateCategory({ id, sort_order: index });
    if (result.error) return fail(result.error);
  }
  return ok({ success: true });
}
