"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, requirePlatformAdmin, type ActionResult } from "@/lib/action";

export async function deleteReservedSubdomain(
  id: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("المعرّف مطلوب");

  const { error } = await auth.supabase.from("reserved_subdomains").delete().eq("id", id);
  if (error) return fail(error.message);
  revalidatePath("/admin/settings");
  return ok({ success: true });
}
