import type { SupabaseClient } from "@supabase/supabase-js";
import {
  addMonths,
  billingErrorMessage,
  installmentAmounts,
  netMenuPrice,
  type MenuBillingInput,
} from "@/lib/menu-billing";

function mapError(message: string) {
  return billingErrorMessage(message);
}

export async function persistMenuBilling(
  db: SupabaseClient,
  restaurantId: string,
  input: MenuBillingInput
) {
  const { data: existing, error: existingError } = await db
    .from("menu_billings")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  if (existingError) return { error: mapError(existingError.message) };

  if (existing?.id) {
    const { count, error } = await db
      .from("menu_installments")
      .select("id", { count: "exact", head: true })
      .eq("billing_id", existing.id)
      .eq("kind", "INSTALLMENT")
      .eq("status", "PAID");
    if (error) return { error: mapError(error.message) };
    if ((count ?? 0) > 0) {
      return { error: "لا يمكن تعديل السعر أو الأقساط بعد تسجيل دفعة." };
    }
  }

  const net = netMenuPrice(input.price, input.discountType, input.discountValue);
  const nextRenewal = input.annualRenewal > 0 ? addMonths(input.startsOn, 12) : null;
  const payload = {
    restaurant_id: restaurantId,
    price: input.price,
    setup_cost: input.setupCost,
    annual_renewal: input.annualRenewal,
    discount_type: input.discountType,
    discount_value: input.discountValue,
    installments_count: input.installmentsCount,
    currency: input.currency,
    starts_on: input.startsOn,
    next_renewal_on: nextRenewal,
    notes: input.notes ?? null,
  };

  const saved = existing?.id
    ? await db.from("menu_billings").update(payload).eq("id", existing.id).select("id, restaurant_id").single()
    : await db.from("menu_billings").insert(payload).select("id, restaurant_id").single();

  if (saved.error || !saved.data) {
    return { error: mapError(saved.error?.message ?? "تعذر حفظ البيانات المالية") };
  }

  await db.from("restaurants").update({ currency: input.currency }).eq("id", restaurantId);

  const billingId = saved.data.id as string;

  const { error: clearError } = await db
    .from("menu_installments")
    .delete()
    .eq("billing_id", billingId)
    .eq("kind", "INSTALLMENT")
    .eq("status", "PENDING");
  if (clearError) return { error: mapError(clearError.message) };

  const rows = installmentAmounts(net, input.installmentsCount).map((amount, index) => ({
    billing_id: billingId,
    restaurant_id: restaurantId,
    kind: "INSTALLMENT",
    sequence: index + 1,
    amount,
    due_on: addMonths(input.startsOn, index),
    status: "PENDING",
  }));

  if (rows.length > 0) {
    const { error } = await db.from("menu_installments").insert(rows);
    if (error) return { error: mapError(error.message) };
  }

  if (input.annualRenewal > 0 && nextRenewal) {
    const { data: pendingRenewal } = await db
      .from("menu_installments")
      .select("id")
      .eq("billing_id", billingId)
      .eq("kind", "RENEWAL")
      .eq("status", "PENDING")
      .maybeSingle();

    if (pendingRenewal?.id) {
      const { error } = await db
        .from("menu_installments")
        .update({ amount: input.annualRenewal, due_on: nextRenewal })
        .eq("id", pendingRenewal.id);
      if (error) return { error: mapError(error.message) };
    } else {
      const { count } = await db
        .from("menu_installments")
        .select("id", { count: "exact", head: true })
        .eq("billing_id", billingId)
        .eq("kind", "RENEWAL");
      const { error } = await db.from("menu_installments").insert({
        billing_id: billingId,
        restaurant_id: restaurantId,
        kind: "RENEWAL",
        sequence: (count ?? 0) + 1,
        amount: input.annualRenewal,
        due_on: nextRenewal,
        status: "PENDING",
      });
      if (error) return { error: mapError(error.message) };
    }
  } else {
    await db
      .from("menu_installments")
      .delete()
      .eq("billing_id", billingId)
      .eq("kind", "RENEWAL")
      .eq("status", "PENDING");
  }

  return { error: null, id: billingId };
}
