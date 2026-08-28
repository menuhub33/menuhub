"use server";

import { cache } from "react";
import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import { createClient } from "@/lib/supabase/server";
import type {
  CategoryWithProducts,
  MenuWithCategories,
  OptionGroupWithOptions,
  ProductWithRelations,
} from "@/components/lib/types";
import type { Category, Menu, Product, ProductImage, ProductOption } from "@/lib/types";

type CategoryRow = Category & {
  products?: Array<
    Product & {
      product_images?: ProductImage[];
      product_option_groups?: Array<
        OptionGroupWithOptions & { product_options?: ProductOption[] }
      >;
    }
  >;
};

const bySortOrder = <T extends { sort_order?: number | null }>(a: T, b: T) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0);

const loadDefaultMenu = cache(async (restaurantId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  const menus = (data ?? []) as Menu[];
  return menus.find((menu) => menu.is_default) ?? menus[0] ?? null;
});

// One nested query instead of walking categories -> products -> images ->
// option groups -> options with a separate round-trip per row.
const loadCatalog = cache(
  async (restaurantId: string): Promise<MenuWithCategories | null> => {
    const supabase = await createClient();
    const menu = await loadDefaultMenu(restaurantId);
    if (!menu) return null;

    const { data, error } = await supabase
      .from("categories")
      .select(
        "*, products(*, product_images(*), product_option_groups(*, product_options(*)))"
      )
      .eq("menu_id", menu.id)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);

    const categories: CategoryWithProducts[] = ((data ?? []) as CategoryRow[]).map(
      (row) => {
        const { products: rawProducts, ...category } = row;

        const products: ProductWithRelations[] = (rawProducts ?? [])
          .slice()
          .sort(bySortOrder)
          .map((row) => {
            const {
              product_images: images,
              product_option_groups: rawGroups,
              ...product
            } = row;

            const optionGroups: OptionGroupWithOptions[] = (rawGroups ?? [])
              .slice()
              .sort(bySortOrder)
              .map((row) => {
                const { product_options: options, ...group } = row;
                return {
                  ...group,
                  options: (options ?? []).slice().sort(bySortOrder),
                };
              });

            return {
              ...product,
              images: (images ?? []).slice().sort(bySortOrder),
              option_groups: optionGroups,
              category,
            };
          });

        return { ...category, products };
      }
    );

    return { ...menu, categories };
  }
);

async function authorize(restaurantId: string) {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth.error ?? "غير مصرح";

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );
  if (!membership) return "غير مصرح لك بعرض قوائم هذا المطعم";

  return null;
}

export async function getDefaultMenu(
  restaurantId: string
): Promise<ActionResult<Menu | null>> {
  const denied = await authorize(restaurantId);
  if (denied) return fail(denied);

  try {
    return ok(await loadDefaultMenu(restaurantId));
  } catch (error) {
    return fail((error as Error).message);
  }
}

export async function getMenuCatalog(
  restaurantId: string
): Promise<ActionResult<MenuWithCategories | null>> {
  const denied = await authorize(restaurantId);
  if (denied) return fail(denied);

  try {
    return ok(await loadCatalog(restaurantId));
  } catch (error) {
    return fail((error as Error).message);
  }
}

export async function getRestaurantProducts(
  restaurantId: string
): Promise<ActionResult<ProductWithRelations[]>> {
  const catalog = await getMenuCatalog(restaurantId);
  if (catalog.error) return fail(catalog.error);
  return ok(
    catalog.data?.categories?.flatMap((category) => category.products ?? []) ?? []
  );
}

export async function getRestaurantOptionGroups(
  restaurantId: string
): Promise<
  ActionResult<Array<OptionGroupWithOptions & { product: ProductWithRelations }>>
> {
  const catalog = await getMenuCatalog(restaurantId);
  if (catalog.error) return fail(catalog.error);

  return ok(
    catalog.data?.categories?.flatMap((category) =>
      (category.products ?? []).flatMap((product) =>
        (product.option_groups ?? []).map((group) => ({ ...group, product }))
      )
    ) ?? []
  );
}
