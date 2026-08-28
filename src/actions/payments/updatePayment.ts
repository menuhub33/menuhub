"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Payment } from "@/lib/types";

export type UpdatePaymentInput = {
  id: string;
  restaurant_id: string;
  payment_method?: string | null;
  transaction_id?: string | null;
};

export async function updatePayment(
  input: UpdatePaymentInput
): Promise<ActionResult<Payment>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف الدفعة والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تعديل الدفعة");
  }

  const payload: Record<string, unknown> = {};
  if (input.payment_method !== undefined) {
    payload.payment_method = input.payment_method;
  }
  if (input.transaction_id !== undefined) {
    payload.transaction_id = input.transaction_id;
  }

  const { data, error } = await auth.supabase
    .from("payments")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Payment);
}
