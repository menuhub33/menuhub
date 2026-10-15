"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, requirePlatformAdmin, type ActionResult } from "@/lib/action";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { persistMenuBilling } from "@/lib/save-menu-billing";
import {
  addMonths,
  billingErrorMessage,
  type DiscountType,
  type InstallmentKind,
  type InstallmentStatus,
  type MenuBillingInput,
} from "@/lib/menu-billing";

export type FinanceInstallment = {
  id: string;
  billing_id: string;
  kind: InstallmentKind;
  sequence: number;
  amount: number;
  due_on: string;
  status: InstallmentStatus;
  paid_at: string | null;
};

export type FinanceContract = {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  price: number;
  annual_renewal: number;
  setup_cost: number;
  discount_type: DiscountType;
  discount_value: number;
  installments_count: number;
  currency: string;
  starts_on: string;
  next_renewal_on: string | null;
  installments: FinanceInstallment[];
};

async function adminDb() {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return { error: auth.error ?? "غير مصرح", db: null };
  const db = hasServiceRole() ? createAdminClient() : auth.supabase;
  return { error: null, db };
}

function num(value: unknown) {
  return Number(value ?? 0);
}

function mapInstallment(row: Record<string, unknown>): FinanceInstallment {
  return {
    id: String(row.id),
    billing_id: String(row.billing_id),
    kind: row.kind as InstallmentKind,
    sequence: num(row.sequence),
    amount: num(row.amount),
    due_on: String(row.due_on),
    status: row.status as InstallmentStatus,
    paid_at: (row.paid_at as string | null) ?? null,
  };
}

export async function getAdminFinance(): Promise<
  ActionResult<{ contracts: FinanceContract[]; restaurants: { id: string; name: string }[] }>
> {
  const auth = await adminDb();
  if (auth.error || !auth.db) return fail(auth.error ?? "غير مصرح");

  const [{ data: billings, error }, { data: restaurants, error: restaurantError }] = await Promise.all([
    auth.db.from("menu_billings").select("*, restaurants(name)").order("created_at", { ascending: false }),
    auth.db.from("restaurants").select("id, name").order("name", { ascending: true }),
  ]);

  if (error) {
    return fail(billingErrorMessage(error.message));
  }
  if (restaurantError) return fail(restaurantError.message);

  const billingRows = billings ?? [];
  const ids = billingRows.map((row) => row.id as string);
  const { data: installments, error: installmentError } = ids.length
    ? await auth.db
        .from("menu_installments")
        .select("*")
        .in("billing_id", ids)
        .order("due_on", { ascending: true })
    : { data: [], error: null };

  if (installmentError) {
    return fail(billingErrorMessage(installmentError.message));
  }

  const grouped = new Map<string, FinanceInstallment[]>();
  for (const row of installments ?? []) {
    const item = mapInstallment(row as Record<string, unknown>);
    const list = grouped.get(item.billing_id) ?? [];
    list.push(item);
    grouped.set(item.billing_id, list);
  }

  const contracts: FinanceContract[] = billingRows.map((row) => {
    const restaurant = row.restaurants as { name?: string } | { name?: string }[] | null;
    const name = Array.isArray(restaurant) ? restaurant[0]?.name : restaurant?.name;
    return {
      id: String(row.id),
      restaurant_id: String(row.restaurant_id),
      restaurant_name: name ?? "مطعم",
      price: num(row.price),
      annual_renewal: num(row.annual_renewal),
      setup_cost: num(row.setup_cost),
      discount_type: row.discount_type as DiscountType,
      discount_value: num(row.discount_value),
      installments_count: num(row.installments_count),
      currency: String(row.currency ?? "SYP"),
      starts_on: String(row.starts_on),
      next_renewal_on: (row.next_renewal_on as string | null) ?? null,
      installments: grouped.get(String(row.id)) ?? [],
    };
  });

  return ok({
    contracts,
    restaurants: (restaurants ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
    })),
  });
}

export async function saveMenuBilling(
  restaurantId: string,
  input: MenuBillingInput
): Promise<ActionResult<{ id: string }>> {
  const auth = await adminDb();
  if (auth.error || !auth.db) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("المطعم مطلوب");

  const saved = await persistMenuBilling(auth.db, restaurantId, input);
  if (saved.error || !saved.id) return fail(saved.error ?? "تعذر حفظ البيانات المالية");

  revalidatePath("/admin/finance");
  revalidatePath("/admin/restaurants");
  return ok({ id: saved.id });
}

export async function deleteMenuBilling(id: string): Promise<ActionResult<{ success: true }>> {
  const auth = await adminDb();
  if (auth.error || !auth.db) return fail(auth.error ?? "غير مصرح");
  const { error } = await auth.db.from("menu_billings").delete().eq("id", id);
  if (error) return fail(billingErrorMessage(error.message));
  revalidatePath("/admin/finance");
  return ok({ success: true });
}

export async function setInstallmentPaid(
  id: string,
  paid: boolean
): Promise<ActionResult<{ success: true }>> {
  const auth = await adminDb();
  if (auth.error || !auth.db) return fail(auth.error ?? "غير مصرح");

  const { data: row, error: readError } = await auth.db
    .from("menu_installments")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (readError) return fail(readError.message);
  if (!row) return fail("الدفعة غير موجودة");

  const { error } = await auth.db
    .from("menu_installments")
    .update({
      status: paid ? "PAID" : "PENDING",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return fail(error.message);

  if (row.kind === "RENEWAL" && paid) {
    const due = String(row.due_on);
    const nextDue = addMonths(due, 12);
    await auth.db.from("menu_billings").update({ next_renewal_on: nextDue }).eq("id", row.billing_id);
    const { count } = await auth.db
      .from("menu_installments")
      .select("id", { count: "exact", head: true })
      .eq("billing_id", row.billing_id)
      .eq("kind", "RENEWAL")
      .eq("status", "PENDING");
    if ((count ?? 0) === 0) {
      await auth.db.from("menu_installments").insert({
        billing_id: row.billing_id,
        restaurant_id: row.restaurant_id,
        kind: "RENEWAL",
        sequence: Number(row.sequence) + 1,
        amount: row.amount,
        due_on: nextDue,
        status: "PENDING",
      });
    }
  }

  revalidatePath("/admin/finance");
  return ok({ success: true });
}
