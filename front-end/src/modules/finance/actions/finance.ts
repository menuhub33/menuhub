"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type {
  DiscountType,
  InstallmentKind,
  InstallmentStatus,
  MenuBillingInput,
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

export async function getAdminFinance(): Promise<
  ActionResult<{ contracts: FinanceContract[]; restaurants: { id: string; name: string }[] }>
> {
  return run(async () => {
    const report = await apiData<{
      contracts: FinanceContract[];
      restaurants: { id: string; name: string }[];
    }>("/admin/finance");
    return { contracts: report.contracts, restaurants: report.restaurants };
  });
}

/** Creates or replaces the contract of a restaurant (and its payment schedule). */
export async function saveMenuBilling(
  restaurantId: string,
  input: MenuBillingInput
): Promise<ActionResult<{ id: string }>> {
  if (!restaurantId) return fail("اختر المطعم");

  return run(async () => {
    const billing = await apiData<{ id: string }>(`/admin/restaurants/${restaurantId}/billing`, {
      method: "PUT",
      body: {
        price: input.price,
        setup_cost: input.setupCost,
        annual_renewal: input.annualRenewal,
        discount_type: input.discountType,
        discount_value: input.discountValue,
        installments_count: input.installmentsCount,
        starts_on: input.startsOn,
        currency: input.currency,
        notes: input.notes ?? null,
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
