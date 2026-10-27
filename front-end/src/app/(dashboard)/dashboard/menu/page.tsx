import { getDashboardStats } from "@/modules/analytics/actions/analytics";
import { MenuOverviewView } from "@/modules/catalog/views/menu-overview-view";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { ErrorState } from "@/core/components/common/error-state";

export default async function MenuPage() {
  const tenant = await requirePermission("menu.view");
  const stats = await getDashboardStats(tenant.restaurant.id);
  if (stats.error || !stats.data) {
    return <ErrorState description={stats.error ?? "تعذر تحميل المنيو"} />;
  }
  return (
    <MenuOverviewView
      restaurant={tenant.restaurant}
      menu={stats.data.menu}
      categoryCount={stats.data.categoryCount}
      productCount={stats.data.productCount}
      canPublish={hasPermission(tenant.role, "menu.publish")}
    />
  );
}
