import { getTheme } from "@/actions/themes/getTheme";
import { getRestaurantTheme } from "@/actions/restaurant-themes/getRestaurantTheme";
import { getMenuCatalog } from "@/actions/catalog/getCatalog";
import { DesignView } from "@/components/views/design-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";
import type { Theme } from "@/lib/types";

export default async function DesignPage() {
  const tenant = await requirePermission("design.update");
  const [themes, current, catalog] = await Promise.all([
    getTheme(),
    getRestaurantTheme(tenant.restaurant.id),
    getMenuCatalog(tenant.restaurant.id),
  ]);
  if (themes.error) return <ErrorState description={themes.error} />;
  const list = (Array.isArray(themes.data) ? themes.data : themes.data ? [themes.data] : []) as Theme[];
  return (
    <DesignView
      restaurant={tenant.restaurant}
      themes={list}
      current={current.data ?? null}
      categories={catalog.data?.categories ?? []}
    />
  );
}
