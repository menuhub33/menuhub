"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { PublicMenuData } from "@/components/lib/types";
import { DEMO_MENU_SLUG, getDemoPublicMenu } from "@/lib/demo-menu";
import type { Menu, Restaurant, RestaurantStatus, MenuStatus, Branch } from "@/lib/types";

export type PublicMenuState =
  | { kind: "live"; data: PublicMenuData }
  | {
      kind: "unavailable";
      reason: "NOT_FOUND" | "DRAFT" | "UNPUBLISHED" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
      name?: string;
      logo_url?: string | null;
    };

export async function getPublicMenu(
  slug: string
): Promise<ActionResult<PublicMenuState>> {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return fail("المعرّف مطلوب");

  if (normalized === DEMO_MENU_SLUG) {
    return ok({ kind: "live", data: getDemoPublicMenu() });
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
  const { data: stateData } = await supabase
    .rpc("restaurant_public_state", { p_slug: normalized })
    .maybeSingle();
  const state = stateData as PublicStateRow | null;

  let restaurant: Restaurant | null = null;
  let restaurantStatus: RestaurantStatus | null = null;
  let menuStatus: MenuStatus | null = null;

  if (state) {
    restaurantStatus = state.status as RestaurantStatus;
    menuStatus = state.menu_status as MenuStatus;
  } else {
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("slug", normalized)
      .maybeSingle();
    restaurant = (data as Restaurant) ?? null;
    restaurantStatus = restaurant?.status ?? null;
    menuStatus = restaurant?.menu_status ?? null;
  }

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

  const { data: fullRestaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", normalized)
    .single();

  if (restaurantError || !fullRestaurant) {
    return ok({ kind: "unavailable", reason: "NOT_FOUND" });
  }

  const { data: menu } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", fullRestaurant.id)
    .eq("is_default", true)
    .maybeSingle();

  const activeMenu =
    (menu as Menu | null) ??
    (
      await supabase
        .from("menus")
        .select("*")
        .eq("restaurant_id", fullRestaurant.id)
        .eq("status", "PUBLISHED")
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data;

  if (!activeMenu || activeMenu.status !== "PUBLISHED") {
    return ok({ kind: "unavailable", reason: "UNPUBLISHED", name: fullRestaurant.name });
  }

  const [{ data: theme }, { data: socialLinks }, { data: categories }, { data: branches }] =
    await Promise.all([
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
        .from("categories")
        .select(
          "*, products(*, product_images(*), product_option_groups(*, product_options(*)))"
        )
        .eq("menu_id", activeMenu.id)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("branches")
        .select("id, name, address, phone")
        .eq("restaurant_id", fullRestaurant.id)
        .eq("is_active", true)
        .order("created_at"),
    ]);

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
}
