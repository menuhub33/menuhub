"use client";

import { useRouter } from "next/navigation";
import { updateMenuStatus } from "@/actions/menus/updateMenuStatus";
import { updateRestaurant } from "@/actions/restaurants/updateRestaurant";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { useToast } from "@/components/ui/toast";
import { publicMenuUrl } from "@/lib/config";
import type { ActivityItem, AnalyticsSummary } from "@/components/lib/types";
import type { Menu, Restaurant } from "@/lib/types";

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
  const url = publicMenuUrl(restaurant.slug);

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
