"use client";

import { useRouter } from "next/navigation";
import { updateMenuStatus } from "@/modules/catalog/actions/menus";
import { updateRestaurant } from "@/modules/tenancy/actions/restaurants";
import { DashboardOverview } from "@/modules/analytics/components/dashboard/dashboard-overview";
import { PageHeader } from "@/core/components/layout/page-header";
import { StatusBadge } from "@/core/components/common/status-badge";
import { StatCard } from "@/modules/analytics/components/dashboard/stat-card";
import { useToast } from "@/core/ui/toast";
import { usePublicMenuUrl } from "@/core/providers";
import type { ActivityItem, AnalyticsSummary } from "@/modules/analytics/types";
import type { Menu } from "@/modules/catalog/types";
import type { Restaurant } from "@/modules/tenancy/types";

export function DashboardHomeView({
  restaurant,
  menu,
  stats,
  activity,
  categoryCount,
  productCount,
  todayViews,
  monthViews,
  canPublish,
}: {
  restaurant: Restaurant;
  menu: Menu | null;
  stats: AnalyticsSummary;
  activity: ActivityItem[];
  categoryCount: number;
  productCount: number;
  todayViews: number;
  monthViews: number;
  canPublish: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const url = usePublicMenuUrl(restaurant.slug);

  async function publish() {
    if (!menu) return;
    const [menuResult, restaurantResult] = await Promise.all([
      updateMenuStatus(menu.id, restaurant.id, "PUBLISHED"),
      updateRestaurant({ id: restaurant.id, menu_status: "PUBLISHED" }),
    ]);
    if (menuResult.error || restaurantResult.error) {
      toast({ title: menuResult.error ?? restaurantResult.error ?? "تعذر النشر", variant: "error" });
      return;
    }
    toast({ title: "تم نشر المنيو بنجاح", variant: "success" });
    router.refresh();
  }

  async function unpublish() {
    if (!menu) return;
    const [menuResult, restaurantResult] = await Promise.all([
      updateMenuStatus(menu.id, restaurant.id, "UNPUBLISHED"),
      updateRestaurant({ id: restaurant.id, menu_status: "UNPUBLISHED" }),
    ]);
    if (menuResult.error || restaurantResult.error) {
      toast({ title: "تعذر إلغاء النشر", variant: "error" });
      return;
    }
    toast({ title: "تم إلغاء نشر المنيو", variant: "success" });
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`مرحبًا، ${restaurant.name} 👋`}
        description="هذه نظرة سريعة على منيو مطعمك اليوم."
        breadcrumbs={[{ label: "الرئيسية" }]}
        actions={<StatusBadge kind="menu" value={menu?.status ?? restaurant.menu_status} />}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="المنتجات" value={productCount} />
        <StatCard label="الأقسام" value={categoryCount} />
        <StatCard label="مشاهدات اليوم" value={todayViews} />
        <StatCard label="مشاهدات الشهر" value={monthViews} />
      </div>
      <DashboardOverview
        restaurant={restaurant}
        menu={menu}
        publicUrl={url}
        stats={stats}
        activity={activity}
        canPublish={canPublish}
        onPublish={publish}
        onUnpublish={unpublish}
      />
    </div>
  );
}
