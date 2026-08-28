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

export type UpdateInvoiceInput = {
  id: string;
  restaurant_id: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  due_date?: string | null;
};

export async function updateInvoice(
  input: UpdateInvoiceInput
): Promise<ActionResult<Invoice>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف الفاتورة والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تعديل الفاتورة");
  }

  const { data: current, error: currentError } = await auth.supabase
    .from("invoices")
    .select("subtotal, discount, tax")
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .single();

  if (currentError || !current) return fail("الفاتورة غير موجودة");

  const subtotal = input.subtotal ?? Number(current.subtotal);
  const discount = input.discount ?? Number(current.discount);
  const tax = input.tax ?? Number(current.tax);

  const payload: Record<string, unknown> = {
    subtotal,
    discount,
    tax,
    total: Math.max(subtotal - discount + tax, 0),
  };
  if (input.due_date !== undefined) payload.due_date = input.due_date;

  const { data, error } = await auth.supabase
    .from("invoices")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Invoice);
}
