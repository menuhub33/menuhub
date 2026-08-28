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

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Counts are resolved server-side with head requests instead of downloading
  // thousands of rows only to read their length.
  const countMenuViews = (from: Date) =>
    auth.supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("restaurant_id", restaurantId)
      .eq("event_type", "MENU_VIEW")
      .gte("created_at", from.toISOString());

  const [categories, today, month, recent, audit] = await Promise.all([
    menu
      ? auth.supabase.from("categories").select("id").eq("menu_id", menu.id)
      : Promise.resolve({ data: [] as { id: string }[] }),
    countMenuViews(startOfToday),
    countMenuViews(startOfMonth),
    getAnalyticsEvent({ restaurant_id: restaurantId, limit: 500 }),
    getAuditLog({ restaurant_id: restaurantId, limit: 8 }),
  ]);

  const categoryIds = (categories.data ?? []).map((row) => row.id as string);
  const categoryCount = categoryIds.length;
  let productCount = 0;
  if (categoryIds.length) {
    const { count } = await auth.supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .in("category_id", categoryIds);
    productCount = count ?? 0;
  }

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
    todayViews: today.count ?? 0,
    monthViews: month.count ?? 0,
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
