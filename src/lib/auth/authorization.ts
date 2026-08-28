import { cookies } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { RESTAURANT_COOKIE } from "@/lib/config";
import { getSession, type AuthSession } from "@/lib/auth/session";
import {
  canAccessAdmin,
  hasPermission,
  type Permission,
} from "@/lib/auth/permissions";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { isRestaurantActivated } from "@/lib/restaurant-status";
import type { Restaurant, RestaurantRole } from "@/lib/types";

type MembershipRow = {
  id: string;
  role: RestaurantRole;
  restaurant_id: string;
};

export type TenantContext = AuthSession & {
  restaurant: Restaurant;
  role: RestaurantRole;
  membershipId: string;
  restaurants: Restaurant[];
};

export async function requireAuth(nextPath = "/dashboard"): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!session.user.email_confirmed_at && session.user.email) {
    redirect("/verify-email");
  }

  if (!session.profile.is_active) {
    redirect("/login?error=suspended");
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

async function loadMemberships(session: AuthSession): Promise<MembershipRow[]> {
  const { data } = await session.supabase
    .from("restaurant_users")
    .select("id, role, restaurant_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true);

  if (data?.length) return data as MembershipRow[];
  if (!hasServiceRole()) return [];

  const { data: owned } = await createAdminClient()
    .from("restaurant_users")
    .select("id, role, restaurant_id")
    .eq("user_id", session.user.id)
    .eq("is_active", true);

  return (owned as MembershipRow[] | null) ?? [];
}

async function loadRestaurants(
  session: AuthSession,
  ids: string[]
): Promise<Restaurant[]> {
  if (ids.length > 0) {
    const { data } = await session.supabase
      .from("restaurants")
      .select("*")
      .in("id", ids);
    if (data?.length) return data as Restaurant[];

    if (hasServiceRole()) {
      const { data: owned } = await createAdminClient()
        .from("restaurants")
        .select("*")
        .in("id", ids);
      if (owned?.length) return owned as Restaurant[];
    }
  }

  const cookieStore = await cookies();
  const preferredId = cookieStore.get(RESTAURANT_COOKIE)?.value;
  if (!preferredId) return [];

  const { data: fromCookie } = await session.supabase
    .from("restaurants")
    .select("*")
    .eq("id", preferredId)
    .maybeSingle();

  if (
    fromCookie &&
    fromCookie.menu_status !== "PUBLISHED"
  ) {
    return [fromCookie as Restaurant];
  }

  return [];
}

export async function getTenantContext(
  currentSession?: AuthSession
): Promise<TenantContext | null> {
  const session = currentSession ?? (await getSession());
  if (!session || !session.profile.is_active) return null;

  const memberships = await loadMemberships(session);
  const restaurants = await loadRestaurants(
    session,
    memberships.map((row) => row.restaurant_id)
  );
  if (restaurants.length === 0) return null;

  const cookieStore = await cookies();
  const preferredId = cookieStore.get(RESTAURANT_COOKIE)?.value;
  const selected =
    restaurants.find((restaurant) => restaurant.id === preferredId) ??
    restaurants[0];

  const membership = memberships.find(
    (row) => row.restaurant_id === selected.id
  );

  return {
    ...session,
    restaurant: selected,
    role: membership?.role ?? "OWNER",
    membershipId: membership?.id ?? selected.id,
    restaurants,
  };
}

export async function requireRestaurantAccess(
  nextPath = "/dashboard"
): Promise<TenantContext> {
  const session = await requireAuth(nextPath);
  const tenant = await getTenantContext(session);
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
