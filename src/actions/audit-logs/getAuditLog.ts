"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { AuditLog } from "@/lib/types";

export type GetAuditLogInput = {
  restaurant_id: string;
  entity_type?: string;
  limit?: number;
};

export async function getAuditLog(
  input: GetAuditLogInput
): Promise<ActionResult<AuditLog[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض سجل التدقيق");

  let query = auth.supabase
    .from("audit_logs")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: false })
    .limit(input.limit ?? 100);

  if (input.entity_type) query = query.eq("entity_type", input.entity_type);

  const { data, error } = await query;
  if (error) return fail(error.message);
  return ok((data ?? []) as AuditLog[]);
}
