"use server";

import { getMenu } from "@/actions/menus/getMenu";
import { getCategory } from "@/actions/categories/getCategory";
import { getProduct } from "@/actions/products/getProduct";
import { getProductImage } from "@/actions/product-images/getProductImage";
import { getOptionGroup } from "@/actions/product-option-groups/getOptionGroup";
import { getProductOption } from "@/actions/product-options/getProductOption";
import { fail, ok, type ActionResult } from "@/lib/action";
import type {
  CategoryWithProducts,
  MenuWithCategories,
  OptionGroupWithOptions,
  ProductWithRelations,
} from "@/components/lib/types";
import type { Category, Menu, Product } from "@/lib/types";

export async function getDefaultMenu(
  restaurantId: string
): Promise<ActionResult<Menu | null>> {
  const result = await getMenu({ restaurant_id: restaurantId });
  if (result.error) return fail(result.error);
  const menus = Array.isArray(result.data)
    ? result.data
    : result.data
      ? [result.data]
      : [];
  return ok(menus.find((menu) => menu.is_default) ?? menus[0] ?? null);
}

export async function getMenuCatalog(
  restaurantId: string
): Promise<ActionResult<MenuWithCategories | null>> {
  const menuResult = await getDefaultMenu(restaurantId);
  if (menuResult.error) return fail(menuResult.error);
  const menu = menuResult.data;
  if (!menu) return ok(null);

  const categoriesResult = await getCategory({ menu_id: menu.id });
  if (categoriesResult.error) return fail(categoriesResult.error);
  const categories = (
    Array.isArray(categoriesResult.data)
      ? categoriesResult.data
      : categoriesResult.data
        ? [categoriesResult.data]
        : []
  ) as Category[];

  const withProducts: CategoryWithProducts[] = [];
  for (const category of categories) {
    const productsResult = await getProduct({ category_id: category.id });
    const products = (
      Array.isArray(productsResult.data)
        ? productsResult.data
        : productsResult.data
          ? [productsResult.data]
          : []
    ) as Product[];
    const hydrated: ProductWithRelations[] = [];
    for (const product of products) {
      const [images, groups] = await Promise.all([
        getProductImage(product.id),
        getOptionGroup({ product_id: product.id }),
      ]);
      const optionGroups = (
        Array.isArray(groups.data) ? groups.data : groups.data ? [groups.data] : []
      ) as OptionGroupWithOptions[];
      const withOptions: OptionGroupWithOptions[] = [];
      for (const group of optionGroups) {
        const options = await getProductOption({ option_group_id: group.id });
        withOptions.push({
          ...group,
          options: Array.isArray(options.data)
            ? options.data
            : options.data
              ? [options.data]
              : [],
        });
      }
      hydrated.push({
        ...product,
        images: images.data ?? [],
        option_groups: withOptions,
        category,
      });
    }
    withProducts.push({ ...category, products: hydrated });
  }

  return ok({ ...menu, categories: withProducts });
}

export async function getRestaurantProducts(restaurantId: string) {
  const catalog = await getMenuCatalog(restaurantId);
  if (catalog.error) return catalog;
  const products = catalog.data?.categories?.flatMap((category) => category.products ?? []) ?? [];
  return ok(products);
}

export async function getRestaurantOptionGroups(restaurantId: string) {
  const catalog = await getMenuCatalog(restaurantId);
  if (catalog.error) return catalog;
  const groups =
    catalog.data?.categories?.flatMap((category) =>
      (category.products ?? []).flatMap((product) =>
        (product.option_groups ?? []).map((group) => ({
          ...group,
          product,
        }))
      )
    ) ?? [];
  return ok(groups);
}
