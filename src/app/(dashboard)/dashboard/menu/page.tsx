import { getDashboardStats } from "@/actions/dashboard/getDashboardStats";
import { MenuOverviewView } from "@/components/views/menu-overview-view";
import { requirePermission } from "@/lib/auth/authorization";
import { hasPermission } from "@/lib/auth/permissions";
import { ErrorState } from "@/components/common/error-state";

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
