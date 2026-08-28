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

export type CreateInvoiceInput = {
  restaurant_id: string;
  subscription_id?: string | null;
  subtotal?: number;
  discount?: number;
  tax?: number;
  currency?: string;
  due_date?: string | null;
};

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<ActionResult<Invoice>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه إنشاء فاتورة");
  }

  const subtotal = input.subtotal ?? 0;
  const discount = input.discount ?? 0;
  const tax = input.tax ?? 0;
  const total = Math.max(subtotal - discount + tax, 0);
  const invoiceNumber = `INV-${Date.now()}`;

  const { data, error } = await auth.supabase
    .from("invoices")
    .insert({
      restaurant_id: input.restaurant_id,
      subscription_id: input.subscription_id ?? null,
      invoice_number: invoiceNumber,
      subtotal,
      discount,
      tax,
      total,
      currency: input.currency ?? "USD",
      status: "PENDING",
      due_date: input.due_date ?? null,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Invoice);
}
