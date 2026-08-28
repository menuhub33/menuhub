"use server";

import {
  fail,
  isValidSlug,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { Plan } from "@/lib/types";

export type CreatePlanInput = {
  name: string;
  slug: string;
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

export async function createPlan(
  input: CreatePlanInput
): Promise<ActionResult<Plan>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const name = input.name?.trim();
  const slug = input.slug?.trim().toLowerCase();
  if (!name || !slug) return fail("اسم الخطة والمعرّف مطلوبان");
  if (!isValidSlug(slug)) return fail("صيغة المعرّف غير صحيحة");

  const { data, error } = await auth.supabase
    .from("plans")
    .insert({
      name,
      slug,
      description: input.description ?? null,
      price_monthly: input.price_monthly ?? 0,
      price_yearly: input.price_yearly ?? 0,
      currency: input.currency ?? "USD",
      max_menus: input.max_menus ?? null,
      max_products: input.max_products ?? null,
      max_branches: input.max_branches ?? null,
      max_staff: input.max_staff ?? null,
      analytics_enabled: input.analytics_enabled ?? false,
      custom_domain_enabled: input.custom_domain_enabled ?? false,
      remove_branding: input.remove_branding ?? false,
      advanced_analytics: input.advanced_analytics ?? false,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Plan);
}
