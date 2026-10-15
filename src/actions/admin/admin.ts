"use server";

import { revalidatePath } from "next/cache";
import { fail, ok, requirePlatformAdmin, type ActionResult } from "@/lib/action";
import { isValidSlug, RESERVED_SUBDOMAINS } from "@/lib/config";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { bootstrapRestaurant } from "@/actions/restaurants/bootstrapRestaurant";
import type {
  Invoice,
  Payment,
  Plan,
  PlatformRole,
  Profile,
  Restaurant,
  Subscription,
} from "@/lib/types";
import { normalizeBusinessType } from "@/lib/business-type";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PLATFORM_ROLES: PlatformRole[] = ["USER", "ADMIN", "SUPER_ADMIN"];

function mapUserError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("already") || value.includes("registered") || value.includes("email_taken")) {
    return "هذا البريد الإلكتروني مسجّل مسبقاً";
  }
  if (value.includes("password")) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  return message || "تعذر حفظ المستخدم";
}

async function adminOrUser() {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return { ...auth, db: auth.supabase };
  const db = hasServiceRole() ? createAdminClient() : auth.supabase;
  return { ...auth, db };
}

export async function getAdminRestaurants(): Promise<
  ActionResult<(Restaurant & { owner_name?: string | null })[]>
> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const { data, error } = await auth.db
    .from("restaurants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return fail(error.message);

  const restaurants = (data ?? []) as Restaurant[];
  if (restaurants.length === 0) return ok([]);

  const ids = restaurants.map((restaurant) => restaurant.id);
  const { data: owners } = await auth.db
    .from("restaurant_users")
    .select("restaurant_id, profiles(full_name)")
    .in("restaurant_id", ids)
    .eq("role", "OWNER");

  const first = <T>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

  const ownerByRestaurant = new Map<string, string | null>();
  for (const row of owners ?? []) {
    const key = row.restaurant_id as string;
    if (ownerByRestaurant.has(key)) continue;
    const profile = first(row.profiles as { full_name?: string | null } | { full_name?: string | null }[] | null);
    ownerByRestaurant.set(key, profile?.full_name ?? null);
  }

  return ok(
    restaurants.map((restaurant) => ({
      ...restaurant,
      owner_name: ownerByRestaurant.get(restaurant.id) ?? null,
    }))
  );
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
  if (id === auth.user.id && !isActive) return fail("لا يمكنك تعليق حسابك الحالي");
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

export async function adminUpdateRestaurant(input: {
  id: string;
  name: string;
  slug: string;
  phone?: string | null;
  description?: string | null;
  status: Restaurant["status"];
  business_type: Restaurant["business_type"];
}): Promise<ActionResult<Restaurant>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (!input.id) return fail("معرّف المطعم مطلوب");
  if (!name) return fail("اسم المطعم مطلوب");
  if (!isValidSlug(slug)) {
    return fail("صيغة الرابط غير صحيحة. استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات");
  }
  if (RESERVED_SUBDOMAINS.has(slug)) return fail("هذا الرابط محجوز ولا يمكن استخدامه");

  const { data: reserved } = await auth.db
    .from("reserved_subdomains")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (reserved) return fail("هذا الرابط محجوز ولا يمكن استخدامه");

  const { data: taken } = await auth.db
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .neq("id", input.id)
    .maybeSingle();
  if (taken) return fail("هذا الرابط مستخدم لمطعم آخر");

  const payload: Record<string, unknown> = {
    name,
    slug,
    phone: input.phone?.trim() || null,
    description: input.description?.trim() || null,
    status: input.status,
    business_type: normalizeBusinessType(input.business_type),
  };
  if (input.status === "ACTIVE" || input.status === "TRIAL") {
    payload.menu_status = "PUBLISHED";
  }

  let result = await auth.db.from("restaurants").update(payload).eq("id", input.id).select().single();
  if (result.error && /business_type|schema cache/i.test(result.error.message)) {
    delete payload.business_type;
    result = await auth.db.from("restaurants").update(payload).eq("id", input.id).select().single();
  }
  if (result.error) return fail(result.error.message);

  if (input.status === "ACTIVE" || input.status === "TRIAL") {
    await auth.db
      .from("menus")
      .update({ status: "PUBLISHED", published_at: new Date().toISOString() })
      .eq("restaurant_id", input.id)
      .eq("is_default", true);
  }

  const restaurant = result.data as Restaurant;
  revalidatePath("/admin");
  revalidatePath("/admin/restaurants");
  if (restaurant.slug) revalidatePath(`/m/${restaurant.slug}`);
  return ok(restaurant);
}

export async function adminCreateUser(input: {
  fullName: string;
  email: string;
  password: string;
  phone?: string | null;
  platformRole: PlatformRole;
}): Promise<ActionResult<Profile>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  if (!fullName) return fail("الاسم مطلوب");
  if (!email || !EMAIL_PATTERN.test(email)) return fail("البريد الإلكتروني غير صالح");
  if ((input.password ?? "").length < 8) return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  if (!PLATFORM_ROLES.includes(input.platformRole)) return fail("الدور غير صالح");

  let userId = "";
  if (hasServiceRole()) {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
    });
    if (error) return fail(mapUserError(error.message));
    if (!data.user) return fail("تعذر إنشاء المستخدم");
    userId = data.user.id;
  } else {
    const { data, error } = await auth.supabase.rpc("admin_create_owner_account", {
      p_email: email,
      p_password: input.password,
      p_full_name: fullName,
    });
    if (error) return fail(mapUserError(error.message));
    if (!data) return fail("تعذر إنشاء المستخدم");
    userId = String(data);
  }

  const { data: profile, error: profileError } = await auth.db
    .from("profiles")
    .update({
      full_name: fullName,
      phone,
      platform_role: input.platformRole,
      is_active: true,
    })
    .eq("id", userId)
    .select()
    .single();
  if (profileError) return fail(profileError.message);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return ok(profile as Profile);
}

export async function adminUpdateUser(input: {
  id: string;
  fullName: string;
  phone?: string | null;
  platformRole: PlatformRole;
}): Promise<ActionResult<Profile>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const fullName = input.fullName.trim();
  if (!input.id) return fail("معرّف المستخدم مطلوب");
  if (!fullName) return fail("الاسم مطلوب");
  if (!PLATFORM_ROLES.includes(input.platformRole)) return fail("الدور غير صالح");
  if (input.id === auth.user.id && input.platformRole === "USER") {
    return fail("لا يمكنك إزالة صلاحياتك");
  }

  const { data, error } = await auth.db
    .from("profiles")
    .update({
      full_name: fullName,
      phone: input.phone?.trim() || null,
      platform_role: input.platformRole,
    })
    .eq("id", input.id)
    .select()
    .single();
  if (error) return fail(error.message);

  revalidatePath("/admin/users");
  return ok(data as Profile);
}

export async function adminDeleteUser(id: string): Promise<ActionResult<{ success: true }>> {
  const auth = await adminOrUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف المستخدم مطلوب");
  if (id === auth.user.id) return fail("لا يمكنك حذف حسابك الحالي");

  if (hasServiceRole()) {
    const { error } = await createAdminClient().auth.admin.deleteUser(id);
    if (error) return fail(error.message);
  } else {
    const { error } = await auth.supabase.rpc("admin_delete_auth_user", { p_user_id: id });
    if (error) return fail(error.message);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return ok({ success: true });
}
