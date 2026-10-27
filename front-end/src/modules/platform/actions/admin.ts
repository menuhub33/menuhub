"use server";

import { apiAll, apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { PlatformRole, Profile } from "@/modules/auth/types";
import type { MenuBillingInput } from "@/modules/finance/lib/menu-billing";
import type { Restaurant } from "@/modules/tenancy/types";

// -------------------------------------------------------------- dashboards

export async function getAdminRestaurants(): Promise<
  ActionResult<(Restaurant & { owner_name?: string | null; owner_email?: string | null })[]>
> {
  return run(() =>
    apiAll<Restaurant & { owner_name?: string | null; owner_email?: string | null }>(
      "/admin/restaurants"
    )
  );
}

export async function getAdminUsers(): Promise<ActionResult<Profile[]>> {
  return run(() => apiAll<Profile>("/admin/users"));
}

export async function getAdminAnalytics(): Promise<
  ActionResult<{ restaurants: number; users: number; published: number; views: number }>
> {
  return run(async () => {
    const stats = await apiData<{
      restaurants: number;
      users: number;
      published: number;
      views: number;
    }>("/admin/stats");
    return {
      restaurants: stats.restaurants,
      users: stats.users,
      published: stats.published,
      views: stats.views,
    };
  });
}

// ------------------------------------------------------------- restaurants

export async function adminSetRestaurantStatus(
  id: string,
  status: Restaurant["status"]
): Promise<ActionResult<Restaurant>> {
  if (!id) return fail("معرّف المطعم مطلوب");
  return run(() =>
    apiData<Restaurant>(`/admin/restaurants/${id}/status`, { method: "PUT", body: { status } })
  );
}

export async function adminSetRestaurantBusinessType(
  id: string,
  businessType: Restaurant["business_type"]
): Promise<ActionResult<Restaurant>> {
  if (!id) return fail("معرّف المطعم مطلوب");
  return run(() =>
    apiData<Restaurant>(`/admin/restaurants/${id}/business-type`, {
      method: "PUT",
      body: { business_type: businessType },
    })
  );
}

export async function adminChangeRestaurantPlan(
  restaurantId: string,
  planId: string
): Promise<ActionResult<{ success: true }>> {
  if (!restaurantId || !planId) return fail("المطعم والخطة مطلوبان");
  return run(async () => {
    await apiData(`/admin/restaurants/${restaurantId}/plan`, {
      method: "PUT",
      body: { plan_id: planId },
    });
    return { success: true as const };
  });
}

export async function adminDeleteRestaurant(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف المطعم مطلوب");
  return run(async () => {
    await apiData(`/admin/restaurants/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

export async function adminCreateRestaurant(input: {
  name: string;
  email: string;
  password: string;
  slug?: string;
  phone?: string | null;
  business_type?: Restaurant["business_type"];
  billing?: MenuBillingInput;
}): Promise<ActionResult<Restaurant>> {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name || !email || !input.password) {
    return fail("اسم المطعم وبريد المالك وكلمة المرور مطلوبة");
  }
  if (input.password.length < 8) return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");

  const billing = input.billing;
  return run(() =>
    apiData<Restaurant>("/admin/restaurants", {
      method: "POST",
      body: {
        name,
        email,
        password: input.password,
        slug: input.slug?.trim().toLowerCase() || undefined,
        phone: input.phone || undefined,
        business_type: input.business_type,
        billing: billing
          ? {
              price: billing.price,
              setup_cost: billing.setupCost,
              annual_renewal: billing.annualRenewal,
              discount_type: billing.discountType,
              discount_value: billing.discountValue,
              installments_count: billing.installmentsCount,
              starts_on: billing.startsOn,
              currency: billing.currency,
              notes: billing.notes ?? null,
            }
          : undefined,
      },
    })
  );
}

export async function adminUpdateRestaurant(input: {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  description?: string | null;
  status: Restaurant["status"];
  business_type: Restaurant["business_type"];
}): Promise<ActionResult<Restaurant>> {
  const { id, ...changes } = input;
  if (!id) return fail("معرّف المطعم مطلوب");
  return run(() =>
    apiData<Restaurant>(`/admin/restaurants/${id}`, {
      method: "PATCH",
      body: { ...changes, slug: changes.slug.trim().toLowerCase() },
    })
  );
}

// ---------------------------------------------------------------- accounts

export async function adminSetUserActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<Profile>> {
  if (!id) return fail("معرّف المستخدم مطلوب");
  return run(() =>
    apiData<Profile>(`/admin/users/${id}/active`, {
      method: "PATCH",
      body: { is_active: isActive },
    })
  );
}

export async function adminCreateUser(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  platformRole: PlatformRole;
}): Promise<ActionResult<Profile>> {
  const fullName = input.fullName?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!fullName || !email || !input.password) {
    return fail("الاسم والبريد وكلمة المرور مطلوبة");
  }
  if (input.password.length < 8) return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");

  return run(() =>
    apiData<Profile>("/admin/users", {
      method: "POST",
      body: {
        full_name: fullName,
        email,
        password: input.password,
        phone: input.phone || null,
        platform_role: input.platformRole,
      },
    })
  );
}

export async function adminUpdateUser(input: {
  id: string;
  fullName: string;
  phone?: string | null;
  platformRole: PlatformRole;
}): Promise<ActionResult<Profile>> {
  if (!input.id) return fail("معرّف المستخدم مطلوب");
  if (!input.fullName?.trim()) return fail("الاسم مطلوب");

  return run(() =>
    apiData<Profile>(`/admin/users/${input.id}`, {
      method: "PATCH",
      body: {
        full_name: input.fullName.trim(),
        phone: input.phone || null,
        platform_role: input.platformRole,
      },
    })
  );
}

export async function adminDeleteUser(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف المستخدم مطلوب");
  return run(async () => {
    await apiData(`/admin/users/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

// -------------------------------------------------------------- demo menus

async function seedDemo(key: "demo" | "demo-cars"): Promise<ActionResult<{ slug: string }>> {
  return run(() => apiData<{ slug: string }>(`/admin/demo/${key}`, { method: "POST" }));
}

export async function seedDemoMenu(): Promise<ActionResult<{ slug: string }>> {
  return seedDemo("demo");
}

export async function seedDemoCarsMenu(): Promise<ActionResult<{ slug: string }>> {
  return seedDemo("demo-cars");
}
