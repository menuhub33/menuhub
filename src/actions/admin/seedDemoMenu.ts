"use server";

import { revalidatePath } from "next/cache";
import { getDemoPublicMenu, DEMO_BUSINESS_HOURS, DEMO_MENU_SLUG } from "@/lib/demo-menu";
import { fail, ok, requirePlatformAdmin, type ActionResult } from "@/lib/action";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function upsertRow(
  db: SupabaseClient,
  table: string,
  payload: Record<string, unknown>
) {
  let current = { ...payload };
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await db.from(table).upsert(current);
    if (!error) return null;
    const missing = error.message.match(/['"]([a-z_]+)['"] column/i)?.[1];
    if (missing && missing in current) {
      delete current[missing];
      continue;
    }
    return error.message;
  }
  return "تعذر حفظ البيانات";
}

export async function seedDemoCatalog(db: SupabaseClient): Promise<string | null> {
  const data = getDemoPublicMenu();
  const restaurant = data.restaurant;

  const restaurantError = await upsertRow(db, "restaurants", { ...restaurant });
  if (restaurantError) return restaurantError;

  const menuError = await upsertRow(db, "menus", { ...data.menu });
  if (menuError) return menuError;

  if (data.theme) {
    const themeError = await upsertRow(db, "restaurant_themes", { ...data.theme });
    if (themeError) return themeError;
  }

  await db.from("menus").update({
    status: "PUBLISHED",
    published_at: data.menu.published_at,
    is_default: true,
  }).eq("id", data.menu.id);

  await db.from("restaurants").update({
    status: "ACTIVE",
    menu_status: "PUBLISHED",
  }).eq("id", restaurant.id);

  for (const branch of data.branches ?? []) {
    const branchError = await upsertRow(db, "branches", {
      id: branch.id,
      restaurant_id: restaurant.id,
      name: branch.name,
      slug: "malki",
      address: branch.address,
      phone: branch.phone,
      is_active: true,
    });
    if (branchError) return branchError;
  }

  await db.from("business_hours").delete().eq("restaurant_id", restaurant.id);
  const hoursError = (
    await db.from("business_hours").insert(
      DEMO_BUSINESS_HOURS.map((row) => ({
        restaurant_id: restaurant.id,
        branch_id: null,
        day_of_week: row.day_of_week,
        open_time: row.open_time,
        close_time: row.close_time,
        is_closed: row.is_closed,
      }))
    )
  ).error;
  if (hoursError) return hoursError.message;

  await db.from("social_links").delete().eq("restaurant_id", restaurant.id);
  if (data.socialLinks && data.socialLinks.length > 0) {
    const { error } = await db.from("social_links").insert(data.socialLinks);
    if (error) return error.message;
  }

  await db.from("categories").delete().eq("menu_id", data.menu.id);

  for (const category of data.categories) {
    const { products, ...categoryRow } = category;
    const categoryError = await upsertRow(db, "categories", { ...categoryRow });
    if (categoryError) return categoryError;

    for (const product of products ?? []) {
      const { images, option_groups, ...productRow } = product;
      const productError = await upsertRow(db, "products", { ...productRow });
      if (productError) return productError;

      if (images && images.length > 0) {
        const { error } = await db.from("product_images").insert(images);
        if (error) return error.message;
      }

      for (const group of option_groups ?? []) {
        const { options, ...groupRow } = group;
        const groupError = await upsertRow(db, "product_option_groups", { ...groupRow });
        if (groupError) return groupError;
        if (options && options.length > 0) {
          const { error } = await db.from("product_options").insert(options);
          if (error) return error.message;
        }
      }
    }
  }

  const { data: freePlan } = await db.from("plans").select("id").eq("slug", "free").maybeSingle();
  if (freePlan) {
    const { data: sub } = await db
      .from("subscriptions")
      .select("id")
      .eq("restaurant_id", restaurant.id)
      .maybeSingle();
    if (!sub) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 365);
      await db.from("subscriptions").insert({
        restaurant_id: restaurant.id,
        plan_id: freePlan.id,
        status: "ACTIVE",
        trial_ends_at: trialEndsAt.toISOString(),
      });
    }
  }

  return null;
}

export async function seedDemoMenu(): Promise<ActionResult<{ slug: string }>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const db = hasServiceRole() ? createAdminClient() : auth.supabase;
  const error = await seedDemoCatalog(db);
  if (error) return fail(error);
  revalidatePath(`/m/${DEMO_MENU_SLUG}`);
  revalidatePath("/admin/restaurants");
  return ok({ slug: DEMO_MENU_SLUG });
}

export async function seedDemoMenuIfPossible(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("slug", DEMO_MENU_SLUG)
      .maybeSingle();
    if (existing?.id) {
      const { data: menu } = await supabase
        .from("menus")
        .select("id")
        .eq("restaurant_id", existing.id)
        .eq("is_default", true)
        .maybeSingle();
      if (menu?.id) {
        const { count } = await supabase
          .from("categories")
          .select("id", { count: "exact", head: true })
          .eq("menu_id", menu.id);
        if ((count ?? 0) > 0) return true;
      }
    }

    const auth = await requirePlatformAdmin();
    if (auth.error || !auth.user) return false;
    const db = hasServiceRole() ? createAdminClient() : auth.supabase;
    const error = await seedDemoCatalog(db);
    if (error) return false;
    revalidatePath(`/m/${DEMO_MENU_SLUG}`);
    return true;
  } catch {
    return false;
  }
}
