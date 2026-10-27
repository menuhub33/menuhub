import { getTheme } from "@/modules/theming/actions/theming";
import { getRestaurantTheme } from "@/modules/theming/actions/theming";
import { getMenuCatalog } from "@/modules/catalog/actions/catalog";
import { DesignView } from "@/modules/theming/views/design-view";
import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";
import type { Theme } from "@/modules/theming/types";

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
