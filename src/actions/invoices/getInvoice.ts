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

export type GetInvoiceInput = {
  id?: string;
  restaurant_id?: string;
};

export async function getInvoice(
  input: GetInvoiceInput
): Promise<ActionResult<Invoice | Invoice[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("invoices")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as Invoice);
  }

  if (!input.restaurant_id) return fail("معرّف الفاتورة أو المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه عرض الفواتير");
  }

  const { data, error } = await auth.supabase
    .from("invoices")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []) as Invoice[]);
}
