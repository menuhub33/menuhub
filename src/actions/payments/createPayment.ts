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

export type CreatePaymentInput = {
  restaurant_id: string;
  subscription_id?: string | null;
  amount: number;
  currency?: string;
  payment_method?: string | null;
  transaction_id?: string | null;
};

export async function createPayment(
  input: CreatePaymentInput
): Promise<ActionResult<Payment>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");
  if (input.amount == null || input.amount < 0) {
    return fail("المبلغ غير صالح");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه إنشاء دفعة");
  }

  const { data, error } = await auth.supabase
    .from("payments")
    .insert({
      restaurant_id: input.restaurant_id,
      subscription_id: input.subscription_id ?? null,
      amount: input.amount,
      currency: input.currency ?? "USD",
      payment_method: input.payment_method ?? null,
      transaction_id: input.transaction_id ?? null,
      status: "PENDING",
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Payment);
}
