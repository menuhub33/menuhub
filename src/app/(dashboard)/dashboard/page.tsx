import { getDashboardStats } from "@/actions/dashboard/getDashboardStats";
import { DashboardHomeView } from "@/components/views/dashboard-home-view";
import { requireRestaurantAccess } from "@/lib/auth/authorization";
import { hasPermission } from "@/lib/auth/permissions";
import { ErrorState } from "@/components/common/error-state";

export default async function DashboardPage() {
  const tenant = await requireRestaurantAccess();
  const stats = await getDashboardStats(tenant.restaurant.id);
  if (stats.error || !stats.data) {
    return <ErrorState description={stats.error ?? "تعذر تحميل الإحصائيات"} />;
  }

  return (
    <DashboardHomeView
      restaurant={tenant.restaurant}
      menu={stats.data.menu}
      stats={stats.data.summary}
      activity={stats.data.activity}
      categoryCount={stats.data.categoryCount}
      productCount={stats.data.productCount}
      todayViews={stats.data.todayViews}
      monthViews={stats.data.monthViews}
      canPublish={hasPermission(tenant.role, "menu.publish")}
    />
  );
}
