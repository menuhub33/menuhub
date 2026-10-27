"use server";

import { apiData, run } from "@/core/api/client";
import type { ActionResult } from "@/core/api/result";
import type {
  CategoryWithProducts,
  Menu,
  MenuWithCategories,
  OptionGroupWithOptions,
  ProductWithRelations,
} from "@/modules/catalog/types";

type CatalogResponse = {
  menus: Menu[];
  menu: Menu | null;
  categories: CategoryWithProducts[];
};

async function loadCatalog(restaurantId: string, menuId?: string) {
  return apiData<CatalogResponse>(`/restaurants/${restaurantId}/catalog`, {
    query: { menu_id: menuId },
  });
}

export async function getDefaultMenu(
  restaurantId: string
): Promise<ActionResult<Menu | null>> {
  return run(async () => (await loadCatalog(restaurantId)).menu);
}

/** The default menu with its categories, products, images and option groups. */
export async function getMenuCatalog(
  restaurantId: string
): Promise<ActionResult<MenuWithCategories | null>> {
  return run(async () => {
    const { menu, categories } = await loadCatalog(restaurantId);
    if (!menu) return null;

    return {
      ...menu,
      categories: categories.map((category) => {
        const { products, ...parent } = category;
        return {
          ...parent,
          products: (products ?? []).map((product) => ({
            ...product,
            images: product.images ?? [],
            option_groups: product.option_groups ?? [],
            category: parent,
          })),
        };
      }),
    };
  });
}

export async function getRestaurantProducts(
  restaurantId: string
): Promise<ActionResult<ProductWithRelations[]>> {
  const catalog = await getMenuCatalog(restaurantId);
  if (catalog.error) return { data: null, error: catalog.error };
  return {
    data: catalog.data?.categories?.flatMap((category) => category.products ?? []) ?? [],
    error: null,
  };
}

export async function getRestaurantOptionGroups(
  restaurantId: string
): Promise<
  ActionResult<Array<OptionGroupWithOptions & { product: ProductWithRelations }>>
> {
  const catalog = await getMenuCatalog(restaurantId);
  if (catalog.error) return { data: null, error: catalog.error };

  return {
    data:
      catalog.data?.categories?.flatMap((category) =>
        (category.products ?? []).flatMap((product) =>
          (product.option_groups ?? []).map((group) => ({ ...group, product }))
        )
      ) ?? [],
    error: null,
  };
}
