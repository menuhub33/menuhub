"use server";

import { revalidatePath } from "next/cache";
import { DEMO_CATALOGS, type DemoCatalog } from "@/lib/demo-catalog";
import { DEMO_MENU_SLUG } from "@/lib/demo-menu";
import { DEMO_CARS_MENU_SLUG } from "@/lib/demo-cars-menu";
import { fail, ok, requirePlatformAdmin, type ActionResult } from "@/lib/action";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function upsertRow(
  db: SupabaseClient,
  table: string,
  payload: Record<string, unknown>
) {
  const current = { ...payload };
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

export async function seedDemoCatalog(
  db: SupabaseClient,
  catalog: DemoCatalog
): Promise<string | null> {
  const data = catalog.getData();
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
      slug: catalog.branchSlug,
      address: branch.address,
      phone: branch.phone,
      is_active: true,
    });
    if (branchError) return branchError;
  }

  await db.from("business_hours").delete().eq("restaurant_id", restaurant.id);
  const hoursError = (
    await db.from("business_hours").insert(
      catalog.hours.map((row) => ({
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

async function seedBySlug(slug: string): Promise<ActionResult<{ slug: string }>> {
  const catalog = DEMO_CATALOGS.find((item) => item.slug === slug);
  if (!catalog) return fail("المنيو التجريبي غير معروف");
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  const db = hasServiceRole() ? createAdminClient() : auth.supabase;
  const error = await seedDemoCatalog(db, catalog);
  if (error) return fail(error);
  revalidatePath(`/m/${catalog.slug}`);
  revalidatePath("/admin/restaurants");
  return ok({ slug: catalog.slug });
}

export async function seedDemoMenu(): Promise<ActionResult<{ slug: string }>> {
  return seedBySlug(DEMO_MENU_SLUG);
}

export async function seedDemoCarsMenu(): Promise<ActionResult<{ slug: string }>> {
  return seedBySlug(DEMO_CARS_MENU_SLUG);
}

async function catalogHasProducts(db: SupabaseClient, slug: string) {
  const { data: existing } = await db
    .from("restaurants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!existing?.id) return false;
  const { data: menu } = await db
    .from("menus")
    .select("id")
    .eq("restaurant_id", existing.id)
    .eq("is_default", true)
    .maybeSingle();
  if (!menu?.id) return false;
  const { count } = await db
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("menu_id", menu.id);
  return (count ?? 0) > 0;
}

export async function seedDemoMenuIfPossible(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const missing = [];
    for (const catalog of DEMO_CATALOGS) {
      if (!(await catalogHasProducts(supabase, catalog.slug))) missing.push(catalog);
    }
    if (missing.length === 0) return true;

    const auth = await requirePlatformAdmin();
    if (auth.error || !auth.user) return false;
    const db = hasServiceRole() ? createAdminClient() : auth.supabase;
    let seeded = false;
    for (const catalog of missing) {
      const error = await seedDemoCatalog(db, catalog);
      if (error) continue;
      revalidatePath(`/m/${catalog.slug}`);
      seeded = true;
    }
    return seeded || missing.length < DEMO_CATALOGS.length;
  } catch {
    return false;
  }
}
