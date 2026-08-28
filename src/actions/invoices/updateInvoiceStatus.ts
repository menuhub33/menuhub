"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Invoice } from "@/lib/types";

export async function updateInvoiceStatus(
  id: string,
  restaurantId: string,
  status: string
): Promise<ActionResult<Invoice>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف الفاتورة والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تغيير حالة الفاتورة");
  }

  const payload: Record<string, unknown> = { status };
  if (status === "PAID") payload.paid_at = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Invoice);
}
