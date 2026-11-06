"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { Plan, Subscription, SubscriptionStatus } from "@/modules/billing/types";

// ------------------------------------------------------------------ plans

export type CreatePlanInput = {
  name: string;
  slug: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number;
  currency?: string;
  max_menus?: number | null;
  max_categories?: number | null;
  max_products?: number | null;
  max_product_images?: number | null;
  max_storage_mb?: number | null;
  max_branches?: number | null;
  max_staff?: number | null;
  analytics_enabled?: boolean;
  custom_domain_enabled?: boolean;
  remove_branding?: boolean;
  advanced_analytics?: boolean;
};

/** Platform administrators only (`/admin/plans`). */
export async function createPlan(input: CreatePlanInput): Promise<ActionResult<Plan>> {
  const name = input.name?.trim();
  const slug = input.slug?.trim().toLowerCase();
  if (!name || !slug) return fail("اسم الخطة ورمزها مطلوبان");

  return run(() =>
    apiData<Plan>("/admin/plans", { method: "POST", body: { ...input, name, slug } })
  );
}

/** Active plans for pricing a new restaurant or menu contract. */
export async function getActivePlans(): Promise<ActionResult<Plan[]>> {
  return run(() => apiData<Plan[]>("/plans", { auth: false }));
}

export async function getAdminPlans(): Promise<ActionResult<Plan[]>> {
  return run(() => apiData<Plan[]>("/admin/plans"));
}

export type UpdatePlanInput = {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_menus: number | null;
  max_categories: number | null;
  max_products: number | null;
  max_product_images: number | null;
  max_storage_mb: number | null;
};

export async function updatePlan(input: UpdatePlanInput): Promise<ActionResult<Plan>> {
  const { id, name, ...limits } = input;
  const trimmed = name.trim();
  if (!id) return fail("معرّف الخطة مطلوب");
  if (!trimmed) return fail("اسم الخطة مطلوب");
  return run(() =>
    apiData<Plan>(`/admin/plans/${id}`, {
      method: "PATCH",
      body: { ...limits, name: trimmed },
    })
  );
}

/** Gallery size for the active restaurant. Falls back to 4 when the plan leaves it open. */
export async function getProductImageCap(restaurantId: string): Promise<ActionResult<number>> {
  return run(async () => {
    const payload = await apiData<{
      plan?: { caps?: { product_images?: number | null } } | null;
    }>(`/restaurants/${restaurantId}`);
    const cap = payload?.plan?.caps?.product_images;
    return cap == null ? 4 : cap;
  });
}

export async function updatePlanStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<Plan>> {
  if (!id) return fail("معرّف الخطة مطلوب");
  return run(() =>
    apiData<Plan>(`/admin/plans/${id}`, { method: "PATCH", body: { is_active: isActive } })
  );
}

// ---------------------------------------------------------- subscriptions

export type UpdateSubscriptionInput = {
  id: string;
  restaurant_id: string;
  plan_id?: string;
  auto_renew?: boolean;
  ends_at?: string | null;
};

export async function updateSubscription(
  input: UpdateSubscriptionInput
): Promise<ActionResult<Subscription>> {
  const { id, restaurant_id: _restaurantId, ...changes } = input;
  void _restaurantId;
  if (!id) return fail("معرّف الاشتراك مطلوب");
  return run(() =>
    apiData<Subscription>(`/admin/subscriptions/${id}`, { method: "PATCH", body: changes })
  );
}

export async function updateSubscriptionStatus(
  id: string,
  _restaurantId: string,
  status: SubscriptionStatus
): Promise<ActionResult<Subscription>> {
  void _restaurantId;
  if (!id) return fail("معرّف الاشتراك مطلوب");
  return run(() =>
    apiData<Subscription>(`/admin/subscriptions/${id}`, { method: "PATCH", body: { status } })
  );
}
