"use server";

import {
  fail,
  isSlugReserved,
  isValidSlug,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import { slugifyName } from "@/lib/config";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Restaurant } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeBusinessType } from "@/lib/business-type";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type BootstrapRestaurantInput = {
  name: string;
  email: string;
  password: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
  business_type?: Restaurant["business_type"];
};

async function uniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  base: string
) {
  let slug = base;
  let attempt = 0;
  while (attempt < 20) {
    if (!isValidSlug(slug) || (await isSlugReserved(supabase, slug))) {
      attempt += 1;
      slug = `${base}-${attempt + 1}`;
      continue;
    }
    const { data } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    attempt += 1;
    slug = `${base}-${attempt + 1}`;
  }
  return `${base}-${Date.now().toString().slice(-6)}`;
}

function mapOwnerCreateError(message: string) {
  const value = message.toLowerCase();
  if (value.includes("email_taken") || value.includes("already") || value.includes("registered")) {
    return "هذا البريد الإلكتروني مسجّل مسبقاً";
  }
  if (value.includes("password_too_short")) {
    return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
  }
  if (value.includes("not_authorized") || value.includes("not authorized")) {
    return "غير مصرح لك بإنشاء الحساب";
  }
  if (value.includes("does not exist") || value.includes("schema cache")) {
    return "تعذر إنشاء الحساب. نفّذ ملف 00007_admin_create_owner.sql في Supabase";
  }
  return message || "تعذر إنشاء حساب المالك";
}

async function createOwnerAccount(
  userClient: SupabaseClient,
  input: { email: string; password: string; fullName: string }
): Promise<ActionResult<string>> {
  if (hasServiceRole()) {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { full_name: input.fullName },
    });
    if (error) return fail(mapOwnerCreateError(error.message));
    if (!data.user) return fail("تعذر إنشاء حساب المالك");
    await admin.from("profiles").upsert({
      id: data.user.id,
      full_name: input.fullName,
      is_active: true,
    });
    return ok(data.user.id);
  }

  const { data, error } = await userClient.rpc("admin_create_owner_account", {
    p_email: input.email,
    p_password: input.password,
    p_full_name: input.fullName,
  });
  if (error) return fail(mapOwnerCreateError(error.message));
  if (!data) return fail("تعذر إنشاء حساب المالك");
  return ok(String(data));
}

async function deleteOwnerAccount(userClient: SupabaseClient, ownerId: string) {
  if (hasServiceRole()) {
    await createAdminClient().auth.admin.deleteUser(ownerId);
    return;
  }
  await userClient.rpc("admin_delete_auth_user", { p_user_id: ownerId });
}

export async function bootstrapRestaurant(
  input: BootstrapRestaurantInput
): Promise<ActionResult<Restaurant>> {
  try {
    return await bootstrapRestaurantUnsafe(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return fail(mapOwnerCreateError(message) || "تعذر إنشاء المطعم");
  }
}

async function bootstrapRestaurantUnsafe(
  input: BootstrapRestaurantInput
): Promise<ActionResult<Restaurant>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password ?? "";
  if (!name) return fail("اسم المطعم مطلوب");
  if (!email || !EMAIL_PATTERN.test(email)) return fail("البريد الإلكتروني غير صالح");
  if (password.length < 8) return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");

  const createdOwner = await createOwnerAccount(auth.supabase, {
    email,
    password,
    fullName: name,
  });
  if (createdOwner.error || !createdOwner.data) {
    return fail(createdOwner.error ?? "تعذر إنشاء حساب المالك");
  }
  const ownerId = createdOwner.data;

  const db = hasServiceRole() ? createAdminClient() : auth.supabase;

  const { data: ownerProfile } = await db
    .from("profiles")
    .select("id, is_active")
    .eq("id", ownerId)
    .maybeSingle();
  if (!ownerProfile) {
    await db.from("profiles").insert({
      id: ownerId,
      full_name: name,
      is_active: true,
    });
  } else if (ownerProfile.is_active === false) {
    await deleteOwnerAccount(auth.supabase, ownerId);
    return fail("حساب المالك معلّق");
  }

  const { data: existingMembership } = await db
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", ownerId)
    .eq("is_active", true)
    .eq("role", "OWNER")
    .limit(1)
    .maybeSingle();

  if (existingMembership?.restaurant_id) {
    return fail("هذا المستخدم يملك مطعماً بالفعل");
  }

  const slug = await uniqueSlug(
    db as unknown as Awaited<ReturnType<typeof createClient>>,
    input.slug?.trim().toLowerCase() || slugifyName(name)
  );

  const restaurantId = crypto.randomUUID();
  const businessType = normalizeBusinessType(input.business_type);
  const insertPayload: Record<string, unknown> = {
    id: restaurantId,
    name,
    slug,
    email,
    description: input.description ?? null,
    phone: input.phone ?? null,
    status: "SUSPENDED",
    menu_status: "DRAFT",
    business_type: businessType,
  };
  let { error } = await db.from("restaurants").insert(insertPayload);

  if (error && /business_type|schema cache/i.test(error.message)) {
    delete insertPayload.business_type;
    const retried = await db.from("restaurants").insert(insertPayload);
    error = retried.error;
  }

  if (error) {
    await deleteOwnerAccount(auth.supabase, ownerId);
    return fail(error.message);
  }

  const { error: memberError } = await db.from("restaurant_users").insert({
    restaurant_id: restaurantId,
    user_id: ownerId,
    role: "OWNER",
    is_active: true,
  });

  if (memberError) {
    await db.from("restaurants").delete().eq("id", restaurantId);
    await deleteOwnerAccount(auth.supabase, ownerId);
    return fail(memberError.message);
  }

  const { data: restaurant, error: loadError } = await db
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .single();

  if (loadError || !restaurant) {
    return fail(loadError?.message ?? "تم إنشاء المطعم لكن تعذر تحميله");
  }

  const { data: modernTheme } = await db
    .from("themes")
    .select("id")
    .eq("slug", "modern")
    .maybeSingle();

  await db.from("restaurant_themes").insert({
    restaurant_id: restaurant.id,
    theme_id: modernTheme?.id ?? null,
    primary_color: "#0f766e",
    secondary_color: "#115e59",
    background_color: "#fafafa",
    text_color: "#18181b",
    font_family: "Expo Arabic",
  });

  await db.from("menus").insert({
    restaurant_id: restaurant.id,
    name: "المنيو الرئيسي",
    slug: "main",
    is_default: true,
    status: "DRAFT",
  });

  const { data: freePlan } = await db
    .from("plans")
    .select("id")
    .eq("slug", "free")
    .maybeSingle();

  if (freePlan) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);
    await db.from("subscriptions").insert({
      restaurant_id: restaurant.id,
      plan_id: freePlan.id,
      status: "TRIAL",
      trial_ends_at: trialEndsAt.toISOString(),
    });
  }

  return ok(restaurant as Restaurant);
}
