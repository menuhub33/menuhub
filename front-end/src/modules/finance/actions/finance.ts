"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type {
  DiscountType,
  InstallmentKind,
  InstallmentStatus,
  MenuBillingInput,
  PosMode,
} from "@/modules/finance/lib/menu-billing";

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
  plan_id?: string | null;
  price: number;
  pos_price?: number;
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

export async function getAdminFinance(): Promise<
  ActionResult<{ contracts: FinanceContract[]; restaurants: { id: string; name: string; pos_mode?: PosMode }[] }>
> {
  return run(async () => {
    const report = await apiData<{
      contracts: FinanceContract[];
      restaurants: { id: string; name: string; pos_mode?: PosMode }[];
    }>("/admin/finance");
    return { contracts: report.contracts, restaurants: report.restaurants };
  });
}

/** Creates or replaces the contract of a restaurant (and its payment schedule). */
export async function saveMenuBilling(
  restaurantId: string,
  input: MenuBillingInput
): Promise<ActionResult<{ id: string }>> {
  if (!restaurantId) return fail("اختر المحل");

  return run(async () => {
    const billing = await apiData<{ id: string }>(`/admin/restaurants/${restaurantId}/billing`, {
      method: "PUT",
      body: {
        plan_id: input.planId,
        price: input.price,
        ...(input.posMode ? { pos_mode: input.posMode } : {}),
        setup_cost: input.setupCost,
        annual_renewal: input.annualRenewal,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        installments_count: input.installmentsCount,
        starts_on: input.startsOn,
        currency: input.currency,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
    return { id: billing.id };
  });
}

export async function deleteMenuBilling(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف العقد مطلوب");

  return run(async () => {
    await apiData(`/admin/finance/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

export async function setInstallmentPaid(
  id: string,
  paid: boolean
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف القسط مطلوب");

  return run(async () => {
    await apiData(`/admin/installments/${id}`, { method: "PATCH", body: { paid } });
    return { success: true as const };
  });
}
