import type { Product } from "@/modules/catalog/types";
import type { AuditLog } from "@/modules/audit/types";

export type EventType =
  | "MENU_VIEW"
  | "PRODUCT_VIEW"
  | "SEARCH"
  | "QR_SCAN"
  | "SHARE";

export type AnalyticsEvent = {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  menu_id: string | null;
  product_id: string | null;
  event_type: EventType;
  session_id: string | null;
  visitor_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type AnalyticsSummary = {
  menuViews: number;
  productViews: number;
  qrScans: number;
  shares: number;
  searches: number;
};

export type ProductViewStat = {
  product: Pick<Product, "id" | "name_ar" | "name_en" | "price" | "currency">;
  imageUrl?: string | null;
  views: number;
};

export type DeviceStat = {
  device: string;
  count: number;
};

export type ActivityItem = Pick<
  AuditLog,
  "id" | "action" | "entity_type" | "entity_id" | "created_at"
> & {
  label?: string | null;
  subject?: string | null;
  actor_name?: string | null;
};

export type AnalyticsSeries = Pick<
  AnalyticsEvent,
  "event_type" | "created_at" | "device_type" | "product_id"
>;
