import type { PaymentMethod, SalesChannel } from "@/modules/sales/types";

export type ReportPeriod =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month"
  | "last_month"
  | "custom";

export type ReportRange = { period: ReportPeriod; from?: string; to?: string };

export type SalesSummary = {
  currency: string;
  sales_total: number;
  invoices_count: number;
  average_invoice: number;
  collections_total: number;
  refunds_total: number;
  net_collections: number;
  unpaid_total: number;
  unpaid_invoices_count: number;
  cancelled_count: number;
  orders_needing_pricing: number;
  excluded_other_currency_orders: number;
  /** Profit after product cost, over the items whose cost was known when they were sold. */
  cost_total: number;
  costed_sales_total: number;
  profit_total: number;
  profit_margin_percent: number;
  /** Share of sales (by value) that has a known cost. */
  cost_coverage_percent: number;
  uncosted_items_count: number;
};

/** Profit columns shared by the products and categories reports (profit_total is null when no cost is known). */
export type ProfitColumns = {
  cost_total: number;
  profit_total: number | null;
  has_uncosted_items: boolean;
};

export type TimeseriesPoint = { bucket: string; invoices_count: number; sales_total: number };

export type ChannelRow = {
  channel: SalesChannel;
  invoices_count: number;
  sales_total: number;
  share_percent: number;
};

export type OrderTypeRow = {
  order_type: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | string;
  invoices_count: number;
  sales_total: number;
  share_percent: number;
};

export type PaymentMethodRow = {
  method: PaymentMethod;
  operations_count: number;
  collections_total: number;
  share_percent: number;
};

export type ProductRow = ProfitColumns & {
  product_id: string | null;
  name: string;
  quantity_sold: number;
  sales_total: number;
};

export type CategoryRow = ProfitColumns & {
  category: string;
  quantity_sold: number;
  sales_total: number;
  share_percent: number;
};

export type StaffRow = {
  user_id: string;
  name: string | null;
  orders_count: number;
  sales_total: number;
  collections_total: number;
  refunds_total: number;
};

export type BranchRow = {
  branch_id: string | null;
  branch_name: string | null;
  invoices_count: number;
  sales_total: number;
  collections_total: number;
  average_invoice: number;
};

export type SalesReports = {
  summary: SalesSummary;
  timeseries: TimeseriesPoint[];
  channels: ChannelRow[];
  orderTypes: OrderTypeRow[];
  paymentMethods: PaymentMethodRow[];
  topProducts: ProductRow[];
  categories: CategoryRow[];
  staff: StaffRow[];
  branches: BranchRow[];
};
