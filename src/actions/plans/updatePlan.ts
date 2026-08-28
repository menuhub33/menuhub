"use server";

import {
  fail,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { Plan } from "@/lib/types";

export type UpdatePlanInput = {
  id: string;
  name?: string;
  description?: string | null;
  price_monthly?: number;
  price_yearly?: number;
  currency?: string;
  max_menus?: number | null;
  max_products?: number | null;
  max_branches?: number | null;
  max_staff?: number | null;
  analytics_enabled?: boolean;
  custom_domain_enabled?: boolean;
  remove_branding?: boolean;
  advanced_analytics?: boolean;
};

export async function updatePlan(
  input: UpdatePlanInput
): Promise<ActionResult<Plan>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف الخطة مطلوب");

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description;
  if (input.price_monthly !== undefined) payload.price_monthly = input.price_monthly;
  if (input.price_yearly !== undefined) payload.price_yearly = input.price_yearly;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.max_menus !== undefined) payload.max_menus = input.max_menus;
  if (input.max_products !== undefined) payload.max_products = input.max_products;
  if (input.max_branches !== undefined) payload.max_branches = input.max_branches;
  if (input.max_staff !== undefined) payload.max_staff = input.max_staff;
  if (input.analytics_enabled !== undefined) {
    payload.analytics_enabled = input.analytics_enabled;
  }
  if (input.custom_domain_enabled !== undefined) {
    payload.custom_domain_enabled = input.custom_domain_enabled;
  }
  if (input.remove_branding !== undefined) {
    payload.remove_branding = input.remove_branding;
  }
  if (input.advanced_analytics !== undefined) {
    payload.advanced_analytics = input.advanced_analytics;
  }

  const { data, error } = await auth.supabase
    .from("plans")
    .update(payload)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Plan);
}
