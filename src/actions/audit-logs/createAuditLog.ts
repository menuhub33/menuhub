"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { AuditLog } from "@/lib/types";

export type CreateAuditLogInput = {
  action: string;
  restaurant_id?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
};

export async function createAuditLog(
  input: CreateAuditLogInput
): Promise<ActionResult<AuditLog>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.action?.trim()) return fail("نوع الإجراء مطلوب");

  const { data, error } = await auth.supabase
    .from("audit_logs")
    .insert({
      restaurant_id: input.restaurant_id ?? null,
      user_id: auth.user.id,
      action: input.action.trim(),
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      old_data: input.old_data ?? null,
      new_data: input.new_data ?? null,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as AuditLog);
}
