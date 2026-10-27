import { getRestaurantTheme } from "@/modules/theming/actions/theming";
import { getMenuCatalog } from "@/modules/catalog/actions/catalog";
import { DesignView } from "@/modules/theming/views/design-view";
import { requirePermission } from "@/core/auth/authorization";

export default async function DesignPage() {
  const tenant = await requirePermission("design.update");
  const [current, catalog] = await Promise.all([
    getRestaurantTheme(tenant.restaurant.id),
    getMenuCatalog(tenant.restaurant.id),
  ]);
  return (
    <DesignView
      restaurant={tenant.restaurant}
      current={current.data ?? null}
      categories={catalog.data?.categories ?? []}
    />
  );
}
