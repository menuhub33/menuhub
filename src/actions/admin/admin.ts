"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, requirePlatformAdmin, type ActionResult } from "@/lib/action";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { bootstrapRestaurant } from "@/actions/restaurants/bootstrapRestaurant";
import type {
  Invoice,
  Payment,
  Plan,
  Profile,
  Restaurant,
  Subscription,
} from "@/lib/types";
import { normalizeBusinessType } from "@/lib/business-type";

async function adminOrUser() {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return { ...auth, db: auth.supabase };
  const db = hasServiceRole() ? createAdminClient() : auth.supabase;
  return { ...auth, db };
}

export async function getAdminRestaurants(): Promise<
  ActionResult<(Restaurant & { owner_name?: string | null; plan_name?: string | null })[]>
> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const { data, error } = await auth.db
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message);

  const restaurants = (data ?? []) as Restaurant[];
  const result = [];
  for (const restaurant of restaurants) {
    const { data: owner } = await auth.db
      .from("restaurant_users")
      .select("user_id, profiles(full_name)")
      .eq("restaurant_id", restaurant.id)
      .eq("role", "OWNER")
      .limit(1)
      .maybeSingle();
    const { data: sub } = await auth.db
      .from("subscriptions")
      .select("plan_id, plans(name)")
      .eq("restaurant_id", restaurant.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const ownerProfile = owner?.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null;
    const ownerName = Array.isArray(ownerProfile)
      ? ownerProfile[0]?.full_name
      : ownerProfile?.full_name;
    const plan = sub?.plans as { name?: string } | { name?: string }[] | null;
    const planName = Array.isArray(plan) ? plan[0]?.name : plan?.name;
    result.push({ ...restaurant, owner_name: ownerName ?? null, plan_name: planName ?? null });
  }
  return ok(result);
}

export async function getAdminUsers(): Promise<ActionResult<Profile[]>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data, error } = await auth.db
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message);
  return ok((data ?? []) as Profile[]);
}

export async function getAdminSubscriptions(): Promise<
  ActionResult<(Subscription & { restaurant_name?: string; plan_name?: string })[]>
> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data, error } = await auth.db
    .from("subscriptions")
    .select("*, restaurants(name), plans(name)")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message);
  return ok(
    (data ?? []).map((row) => {
      const restaurant = row.restaurants as { name?: string } | { name?: string }[] | null;
      const plan = row.plans as { name?: string } | { name?: string }[] | null;
      return {
        ...(row as Subscription),
        restaurant_name: Array.isArray(restaurant) ? restaurant[0]?.name : restaurant?.name,
        plan_name: Array.isArray(plan) ? plan[0]?.name : plan?.name,
      };
    })
  );
}

export async function getAdminPayments(): Promise<
  ActionResult<(Payment & { restaurant_name?: string })[]>
> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data, error } = await auth.db
    .from("payments")
    .select("*, restaurants(name)")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message);
  return ok(
    (data ?? []).map((row) => {
      const restaurant = row.restaurants as { name?: string } | { name?: string }[] | null;
      return {
        ...(row as Payment),
        restaurant_name: Array.isArray(restaurant) ? restaurant[0]?.name : restaurant?.name,
      };
    })
  );
}

export async function getAdminInvoices(): Promise<ActionResult<Invoice[]>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data, error } = await auth.db
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message);
  return ok((data ?? []) as Invoice[]);
}

export async function getAdminPlans(): Promise<ActionResult<Plan[]>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data, error } = await auth.db
    .from("plans")
    .select("*")
    .order("price_monthly", { ascending: true });
  if (error) return fail(error.message);
  return ok((data ?? []) as Plan[]);
}

export async function getAdminAnalytics(): Promise<
  ActionResult<{ restaurants: number; users: number; published: number; views: number }>
> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const [{ count: restaurants }, { count: users }, { count: published }, { count: views }] =
    await Promise.all([
      auth.db.from("restaurants").select("id", { count: "exact", head: true }),
      auth.db.from("profiles").select("id", { count: "exact", head: true }),
      auth.db
        .from("restaurants")
        .select("id", { count: "exact", head: true })
        .eq("menu_status", "PUBLISHED"),
      auth.db
        .from("analytics_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "MENU_VIEW"),
    ]);
  return ok({
    restaurants: restaurants ?? 0,
    users: users ?? 0,
    published: published ?? 0,
    views: views ?? 0,
  });
}

export async function adminSetRestaurantStatus(
  id: string,
  status: Restaurant["status"]
): Promise<ActionResult<Restaurant>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const payload: Record<string, unknown> = { status };
  if (status === "ACTIVE" || status === "TRIAL") {
    payload.menu_status = "PUBLISHED";
  }
  const { data, error } = await auth.db
    .from("restaurants")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) return fail(error.message);
  if (status === "ACTIVE" || status === "TRIAL") {
    await auth.db
      .from("menus")
      .update({ status: "PUBLISHED", published_at: new Date().toISOString() })
      .eq("restaurant_id", id)
      .eq("is_default", true);
  }
  const restaurant = data as Restaurant;
  if (restaurant.slug) revalidatePath(`/m/${restaurant.slug}`);
  return ok(restaurant);
}

export async function adminDeleteRestaurant(
  id: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { error } = await auth.db.from("restaurants").delete().eq("id", id);
  if (error) return fail(error.message);
  return ok({ success: true });
}

export async function adminChangeRestaurantPlan(
  restaurantId: string,
  planId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data: current } = await auth.db
    .from("subscriptions")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (current?.id) {
    const { error } = await auth.db
      .from("subscriptions")
      .update({ plan_id: planId, status: "ACTIVE" })
      .eq("id", current.id);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.db.from("subscriptions").insert({
      restaurant_id: restaurantId,
      plan_id: planId,
      status: "ACTIVE",
    });
    if (error) return fail(error.message);
  }
  return ok({ success: true });
}

export async function adminSetRestaurantBusinessType(
  id: string,
  businessType: Restaurant["business_type"]
): Promise<ActionResult<Restaurant>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const type = normalizeBusinessType(businessType);
  const { data, error } = await auth.db
    .from("restaurants")
    .update({ business_type: type })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    if (/business_type|schema cache/i.test(error.message)) {
      return fail("عمود نوع النشاط غير موجود. نفّذ ملف 00011_business_type.sql في Supabase");
    }
    return fail(error.message);
  }
  const restaurant = data as Restaurant;
  if (restaurant.slug) revalidatePath(`/m/${restaurant.slug}`);
  return ok(restaurant);
}

export async function adminSetUserActive(
  id: string,
  isActive: boolean
): Promise<ActionResult<Profile>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const { data, error } = await auth.db
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
  if (error) return fail(error.message);
  return ok(data as Profile);
}

export async function adminCreateRestaurant(input: {
  name: string;
  email: string;
  password: string;
  slug?: string;
  phone?: string | null;
  business_type?: Restaurant["business_type"];
}): Promise<ActionResult<Restaurant>> {
  return bootstrapRestaurant({
    name: input.name,
    email: input.email,
    password: input.password,
    slug: input.slug,
    phone: input.phone,
    business_type: input.business_type,
  });
}
