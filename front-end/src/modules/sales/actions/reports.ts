"use server";

import { apiData, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import { fail, type ActionResult } from "@/core/api/result";
import type {
  BranchRow,
  CategoryRow,
  ChannelRow,
  OrderTypeRow,
  PaymentMethodRow,
  ProductRow,
  ReportRange,
  SalesReports,
  SalesSummary,
  StaffRow,
  TimeseriesPoint,
} from "@/modules/sales/report-types";

/** Every sales report of the restaurant for one period, fetched in parallel (owner / manager only). */
export async function loadSalesReports(range: ReportRange): Promise<ActionResult<SalesReports>> {
  if (range.period === "custom" && (!range.from || !range.to)) return fail("حدد بداية ونهاية الفترة");

  return run(async () => {
    const base = `/restaurants/${await requireTenantId()}/sales/reports`;
    const query = { period: range.period, from: range.from, to: range.to };

    // A single day reads best hour by hour; longer periods are grouped per day.
    const [summary, timeseries, channels, orderTypes, paymentMethods, topProducts, categories, staff, branches] =
      await Promise.all([
        apiData<SalesSummary>(`${base}/summary`, { query }),
        apiData<TimeseriesPoint[]>(`${base}/timeseries`, {
          query: { ...query, granularity: range.period === "today" || range.period === "yesterday" ? "hour" : "day" },
        }),
        apiData<ChannelRow[]>(`${base}/channels`, { query }),
        apiData<OrderTypeRow[]>(`${base}/order-types`, { query }),
        apiData<PaymentMethodRow[]>(`${base}/payment-methods`, { query }),
        apiData<ProductRow[]>(`${base}/products`, { query: { ...query, order: "top", limit: 10 } }),
        apiData<CategoryRow[]>(`${base}/categories`, { query }),
        apiData<StaffRow[]>(`${base}/staff`, { query }),
        apiData<BranchRow[]>(`${base}/branches`, { query }),
      ]);

    return { summary, timeseries, channels, orderTypes, paymentMethods, topProducts, categories, staff, branches };
  });
}
