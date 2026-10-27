import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { ApiError, apiData } from "@/core/api/client";
import { RESTAURANT_COOKIE } from "@/core/config";
import { canAccessAdmin, hasPermission, type Permission } from "@/core/auth/permissions";
import { getSession, type AuthSession } from "@/core/auth/session";
import { getToken } from "@/core/auth/token";
import { isRestaurantActivated } from "@/modules/tenancy/lib/restaurant-status";
import type { Restaurant, RestaurantRole } from "@/modules/tenancy/types";

export type Membership = {
  id: string;
  role: RestaurantRole;
  restaurant: Restaurant;
};

export type TenantContext = AuthSession & {
  restaurant: Restaurant;
  role: RestaurantRole;
  membershipId: string;
  restaurants: Restaurant[];
};

// ------------------------------------------------------------------ guards

export async function requireAuth(nextPath = "/dashboard"): Promise<AuthSession> {
  const session = await getSession();

  if (!session) {
    const next = encodeURIComponent(nextPath);
    // A token that the API no longer accepts must be cleared before the login
    // page, otherwise the proxy would bounce the user straight back.
    redirect((await getToken()) ? `/auth/expired?next=${next}` : `/login?next=${next}`);
  }

  if (!session.profile.is_active) {
    redirect("/auth/expired?reason=suspended");
  }

  return session;
}

export async function requirePlatformAdmin(nextPath = "/admin"): Promise<AuthSession> {
  const session = await requireAuth(nextPath);
  if (!canAccessAdmin(session.profile.platform_role)) {
    forbidden();
  }
  return session;
}

// ------------------------------------------------------------------ tenancy

/** Restaurants the account belongs to (`GET /me/restaurants`), once per request. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  if (!(await getSession())) return [];
  return (await apiData<Membership[]>("/me/restaurants")) ?? [];
});

/**
 * The restaurant the dashboard is working on: the one stored in the
 * `mh-restaurant-id` cookie when the user still belongs to it, otherwise the
 * first membership.
 */
export const getActiveMembership = cache(async (): Promise<Membership | null> => {
  const memberships = await getMemberships();
  if (memberships.length === 0) return null;

  const store = await cookies();
  const preferred = store.get(RESTAURANT_COOKIE)?.value;
  return memberships.find((item) => item.restaurant.id === preferred) ?? memberships[0];
});

/** Id of the active restaurant, for actions that act on the current tenant. */
export async function requireTenantId(): Promise<string> {
  const membership = await getActiveMembership();
  if (!membership) throw new ApiError("لا يوجد مطعم محدد لحسابك", 400, "NO_RESTAURANT");
  return membership.restaurant.id;
}

// Cached per request: the layout and every page below it resolve the same tenant.
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
  const session = await getSession();
  if (!session || !session.profile.is_active) return null;

  const memberships = await getMemberships();
  const active = await getActiveMembership();
  if (!active) return null;

  return {
    ...session,
    restaurant: active.restaurant,
    role: active.role,
    membershipId: active.id,
    restaurants: memberships.map((item) => item.restaurant),
  };
});

export async function requireRestaurantAccess(
  nextPath = "/dashboard"
): Promise<TenantContext> {
  await requireAuth(nextPath);
  const tenant = await getTenantContext();
  if (!tenant || !isRestaurantActivated(tenant.restaurant.status)) {
    redirect("/onboarding");
  }
  return tenant;
}

export async function requireRole(
  roles: RestaurantRole[],
  nextPath = "/dashboard"
): Promise<TenantContext> {
  const tenant = await requireRestaurantAccess(nextPath);
  if (!roles.includes(tenant.role)) {
    forbidden();
  }
  return tenant;
}

export async function requirePermission(
  permission: Permission,
  nextPath = "/dashboard"
): Promise<TenantContext> {
  const tenant = await requireRestaurantAccess(nextPath);
  if (!hasPermission(tenant.role, permission)) {
    forbidden();
  }
  return tenant;
}
