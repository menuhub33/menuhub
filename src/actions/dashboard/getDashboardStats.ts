"use server";

import { getMenu } from "@/actions/menus/getMenu";
import { getAnalyticsEvent } from "@/actions/analytics/getAnalyticsEvent";
import { getAuditLog } from "@/actions/audit-logs/getAuditLog";
import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { ActivityItem, AnalyticsSummary } from "@/components/lib/types";
import type { Menu } from "@/lib/types";

export type DashboardStats = {
  menu: Menu | null;
  categoryCount: number;
  productCount: number;
  todayViews: number;
  monthViews: number;
  summary: AnalyticsSummary;
  activity: ActivityItem[];
};

export async function getDashboardStats(
  restaurantId: string
): Promise<ActionResult<DashboardStats>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const menusResult = await getMenu({ restaurant_id: restaurantId });
  if (menusResult.error) return fail(menusResult.error);
  const menus = Array.isArray(menusResult.data)
    ? menusResult.data
    : menusResult.data
      ? [menusResult.data]
      : [];
  const menu = menus.find((item) => item.is_default) ?? menus[0] ?? null;

  let categoryCount = 0;
  let productCount = 0;
  if (menu) {
    const { data: categories } = await auth.supabase
      .from("categories")
      .select("id")
      .eq("menu_id", menu.id);
    categoryCount = categories?.length ?? 0;
    const ids = (categories ?? []).map((row) => row.id as string);
    if (ids.length) {
      const { count } = await auth.supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .in("category_id", ids);
      productCount = count ?? 0;
    }
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [today, month, recent, audit] = await Promise.all([
    getAnalyticsEvent({
      restaurant_id: restaurantId,
      event_type: "MENU_VIEW",
      from: startOfToday.toISOString(),
      limit: 5000,
    }),
    getAnalyticsEvent({
      restaurant_id: restaurantId,
      event_type: "MENU_VIEW",
      from: startOfMonth.toISOString(),
      limit: 5000,
    }),
    getAnalyticsEvent({ restaurant_id: restaurantId, limit: 500 }),
    getAuditLog({ restaurant_id: restaurantId, limit: 8 }),
  ]);

  const events = recent.data ?? [];
  const summary: AnalyticsSummary = {
    menuViews: events.filter((event) => event.event_type === "MENU_VIEW").length,
    productViews: events.filter((event) => event.event_type === "PRODUCT_VIEW").length,
    qrScans: events.filter((event) => event.event_type === "QR_SCAN").length,
    shares: events.filter((event) => event.event_type === "SHARE").length,
    searches: events.filter((event) => event.event_type === "SEARCH").length,
  };

  return ok({
    menu,
    categoryCount,
    productCount,
    todayViews: today.data?.length ?? 0,
    monthViews: month.data?.length ?? 0,
    summary,
    activity: (audit.data ?? []).map((item) => ({
      id: item.id,
      action: item.action,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      created_at: item.created_at,
    })),
  });
}
