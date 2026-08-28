"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Payment, PaymentStatus } from "@/lib/types";

export async function updatePaymentStatus(
  id: string,
  restaurantId: string,
  status: PaymentStatus
): Promise<ActionResult<Payment>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف الدفعة والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تغيير حالة الدفعة");
  }

  const payload: Record<string, unknown> = { status };
  if (status === "PAID") payload.paid_at = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("payments")
    .update(payload)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Payment);
}
