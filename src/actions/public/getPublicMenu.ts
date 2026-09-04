"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { PublicMenuData } from "@/components/lib/types";
import { getDemoCatalog } from "@/lib/demo-catalog";
import type { Menu, Restaurant, RestaurantStatus, MenuStatus, Branch } from "@/lib/types";

export type PublicMenuState =
  | { kind: "live"; data: PublicMenuData }
  | {
      kind: "unavailable";
      reason: "NOT_FOUND" | "DRAFT" | "UNPUBLISHED" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
      name?: string;
      logo_url?: string | null;
    };

// `generateMetadata` and the page body both need the menu; without this cache
// the whole tree is fetched twice on every public menu request.
const loadPublicMenu = cache(async function loadPublicMenu(
  slug: string
): Promise<ActionResult<PublicMenuState>> {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return fail("المعرّف مطلوب");

  const demo = getDemoCatalog(normalized);
  if (demo) {
    return ok({ kind: "live", data: demo.getData() });
  }

  const supabase = await createClient();
  type PublicStateRow = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    status: RestaurantStatus;
    menu_status: MenuStatus;
  };
  // The status probe and the full row are independent; the RPC only exists as
  // an RLS-safe fallback for restaurants the anon role cannot select.
  const [{ data: stateData }, { data: restaurantData }] = await Promise.all([
    supabase.rpc("restaurant_public_state", { p_slug: normalized }).maybeSingle(),
    supabase.from("restaurants").select("*").eq("slug", normalized).maybeSingle(),
  ]);

  const state = stateData as PublicStateRow | null;
  const restaurant = (restaurantData as Restaurant | null) ?? null;

  const restaurantStatus: RestaurantStatus | null =
    (state?.status as RestaurantStatus | undefined) ?? restaurant?.status ?? null;
  const menuStatus: MenuStatus | null =
    (state?.menu_status as MenuStatus | undefined) ?? restaurant?.menu_status ?? null;

  if (!restaurantStatus) {
    return ok({ kind: "unavailable", reason: "NOT_FOUND" });
  }

  if (restaurantStatus === "SUSPENDED") {
    return ok({
      kind: "unavailable",
      reason: "SUSPENDED",
      name: state?.name ?? restaurant?.name,
      logo_url: state?.logo_url ?? restaurant?.logo_url,
    });
  }
  if (restaurantStatus === "EXPIRED") {
    return ok({ kind: "unavailable", reason: "EXPIRED", name: state?.name ?? restaurant?.name });
  }
  if (restaurantStatus === "CANCELLED") {
    return ok({ kind: "unavailable", reason: "CANCELLED", name: state?.name ?? restaurant?.name });
  }
  if (menuStatus === "DRAFT") {
    return ok({ kind: "unavailable", reason: "DRAFT", name: state?.name ?? restaurant?.name });
  }
  if (menuStatus === "UNPUBLISHED") {
    return ok({ kind: "unavailable", reason: "UNPUBLISHED", name: state?.name ?? restaurant?.name });
  }

  const fullRestaurant = restaurant;
  if (!fullRestaurant) {
    return ok({ kind: "unavailable", reason: "NOT_FOUND" });
  }

  // Everything that only needs the restaurant id runs alongside the menu lookup.
  const [{ data: menus }, { data: theme }, { data: socialLinks }, { data: branches }] =
    await Promise.all([
      supabase
        .from("menus")
        .select("*")
        .eq("restaurant_id", fullRestaurant.id)
        .order("published_at", { ascending: false }),
      supabase
        .from("restaurant_themes")
        .select("*")
        .eq("restaurant_id", fullRestaurant.id)
        .maybeSingle(),
      supabase
        .from("social_links")
        .select("*")
        .eq("restaurant_id", fullRestaurant.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("branches")
        .select("id, name, address, phone")
        .eq("restaurant_id", fullRestaurant.id)
        .eq("is_active", true)
        .order("created_at"),
    ]);

  const allMenus = (menus ?? []) as Menu[];
  const activeMenu =
    allMenus.find((item) => item.is_default) ??
    allMenus.find((item) => item.status === "PUBLISHED") ??
    null;

  if (!activeMenu || activeMenu.status !== "PUBLISHED") {
    return ok({ kind: "unavailable", reason: "UNPUBLISHED", name: fullRestaurant.name });
  }

  const { data: categories } = await supabase
    .from("categories")
    .select(
      "*, products(*, product_images(*), product_option_groups(*, product_options(*)))"
    )
    .eq("menu_id", activeMenu.id)
    .eq("is_active", true)
    .order("sort_order");

  const mappedCategories = (categories ?? []).map((category) => {
    const rawProducts = (category as { products?: unknown }).products;
    const products = Array.isArray(rawProducts)
      ? rawProducts
      : rawProducts
        ? [rawProducts]
        : [];
    return {
      ...category,
      products: products.map((product: Record<string, unknown>) => ({
        ...product,
        images: product.product_images ?? [],
        option_groups: (
          (product.product_option_groups as Record<string, unknown>[] | undefined) ?? []
        ).map((group) => ({
          ...group,
          options: group.product_options ?? [],
        })),
      })),
    };
  });

  return ok({
    kind: "live",
    data: {
      restaurant: fullRestaurant as Restaurant,
      menu: activeMenu as Menu,
      theme: theme ?? null,
      categories: mappedCategories,
      socialLinks: socialLinks ?? [],
      branches: (branches ?? []) as Array<Pick<Branch, "id" | "name" | "address" | "phone">>,
    },
  });
});

export async function getPublicMenu(
  slug: string
): Promise<ActionResult<PublicMenuState>> {
  return loadPublicMenu(slug);
}
