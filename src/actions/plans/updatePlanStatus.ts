"use server";

import {
  fail,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { Plan } from "@/lib/types";

export async function updatePlanStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<Plan>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف الخطة مطلوب");

  const { data, error } = await auth.supabase
    .from("plans")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Plan);
}
