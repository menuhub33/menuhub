"use server";

import { apiData, apiPage, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { Menu } from "@/modules/catalog/types";
import type {
  ActivityItem,
  AnalyticsEvent,
  AnalyticsSummary,
  EventType,
} from "@/modules/analytics/types";

// ----------------------------------------------------------- visitor events

export type CreateAnalyticsEventInput = {
  /** Public slug of the menu being viewed (the API resolves the restaurant). */
  slug: string;
  event_type: EventType;
  branch_id?: string | null;
  menu_id?: string | null;
  product_id?: string | null;
  session_id?: string | null;
  visitor_id?: string | null;
  /** Kept for call-site compatibility; the API reads the real User-Agent. */
  user_agent?: string | null;
  referrer?: string | null;
  device_type?: string | null;
  metadata?: Record<string, unknown>;
};

/** Anonymous tracking from the public menu. Never surfaces errors to visitors. */
export async function createAnalyticsEvent(
  input: CreateAnalyticsEventInput
): Promise<ActionResult<{ success: true }>> {
  const { slug, user_agent: _ua, device_type: _device, ...body } = input;
  void _ua;
  void _device;
  if (!slug) return fail("المعرّف مطلوب");

  return run(async () => {
    await apiData(`/public/menus/${encodeURIComponent(slug)}/events`, {
      method: "POST",
      auth: false,
      body,
    });
    return { success: true as const };
  });
}

// ------------------------------------------------------------- dashboard

export type GetAnalyticsEventInput = {
  restaurant_id: string;
  event_type?: EventType;
  menu_id?: string;
  product_id?: string;
  from?: string;
  to?: string;
  limit?: number;
};

const EVENTS_PAGE_SIZE = 200;

export async function getAnalyticsEvent(
  input: GetAnalyticsEventInput
): Promise<ActionResult<AnalyticsEvent[]>> {
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");
  const limit = Math.min(input.limit ?? 1000, 5000);

  return run(async () => {
    const events: AnalyticsEvent[] = [];
    for (let page = 1; events.length < limit; page += 1) {
      const result = await apiPage<AnalyticsEvent>(
        `/restaurants/${input.restaurant_id}/analytics/events`,
        {
          query: {
            event_type: input.event_type,
            menu_id: input.menu_id,
            product_id: input.product_id,
            from: input.from,
            to: input.to,
            per_page: EVENTS_PAGE_SIZE,
            page,
          },
        }
      );
      events.push(...result.items);
      if (page >= result.lastPage) break;
    }
    return events.slice(0, limit);
  });
}

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
  if (!restaurantId) return fail("معرّف المطعم مطلوب");
  return run(() => apiData<DashboardStats>(`/restaurants/${restaurantId}/dashboard`));
}
