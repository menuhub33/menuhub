"use client";

import { AnalyticsDateRange, type DateRangeValue } from "@/components/analytics/analytics-date-range";
import { AnalyticsStatCard } from "@/components/analytics/analytics-stat-card";
import { DeviceStatistics } from "@/components/analytics/device-statistics";
import { ProductViewsChart } from "@/components/analytics/product-views-chart";
import { TopProducts } from "@/components/analytics/top-products";
import { TrafficChart } from "@/components/analytics/traffic-chart";
import { ViewsChart } from "@/components/analytics/views-chart";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import type {
  AnalyticsSummary,
  ChartPoint,
  DeviceStat,
  ProductViewStat,
} from "@/components/lib/types";
import { ChartIcon } from "@/components/ui/icons";

export function AnalyticsOverview({
  summary,
  menuViews = [],
  productViews = [],
  qrScans = [],
  shares = [],
  searches = [],
  topProducts = [],
  devices = [],
  from,
  to,
  onRangeChange,
  loading,
  error,
  onRetry,
}: {
  summary?: AnalyticsSummary;
  menuViews?: ChartPoint[];
  productViews?: ChartPoint[];
  qrScans?: ChartPoint[];
  shares?: ChartPoint[];
  searches?: ChartPoint[];
  topProducts?: ProductViewStat[];
  devices?: DeviceStat[];
  from: string;
  to: string;
  onRangeChange: (range: DateRangeValue) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <LoadingState label="جارٍ تحميل الإحصائيات..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  const hasAnyData = Boolean(
    summary ||
      menuViews.length ||
      productViews.length ||
      qrScans.length ||
      shares.length ||
      searches.length ||
      topProducts.length ||
      devices.length
  );

  if (!hasAnyData) {
    return (
      <div className="grid gap-4">
        <AnalyticsDateRange from={from} to={to} onChange={onRangeChange} />
        <EmptyState
          title="لا توجد إحصائيات بعد"
          description="ستظهر هنا مشاهدات المنيو والمنتجات وحركة الزيارات عند بدء الاستخدام."
          icon={<ChartIcon className="size-7" />}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <AnalyticsDateRange from={from} to={to} onChange={onRangeChange} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AnalyticsStatCard label="مشاهدات المنيو" value={summary?.menuViews ?? 0} />
        <AnalyticsStatCard label="مشاهدات المنتجات" value={summary?.productViews ?? 0} />
        <AnalyticsStatCard label="مسح QR" value={summary?.qrScans ?? 0} />
        <AnalyticsStatCard label="المشاركات" value={summary?.shares ?? 0} />
        <AnalyticsStatCard label="عمليات البحث" value={summary?.searches ?? 0} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ViewsChart points={menuViews} />
        <ProductViewsChart points={productViews} />
      </div>
      <TrafficChart qrScans={qrScans} shares={shares} searches={searches} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TopProducts items={topProducts} />
        <DeviceStatistics items={devices} />
      </div>
    </div>
  );
}
