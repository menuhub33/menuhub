"use client";

import { AnalyticsDateRange, type DateRangeValue } from "@/modules/analytics/components/analytics/analytics-date-range";
import { AnalyticsStatCard } from "@/modules/analytics/components/analytics/analytics-stat-card";
import { DeviceStatistics } from "@/modules/analytics/components/analytics/device-statistics";
import { ProductViewsChart } from "@/modules/analytics/components/analytics/product-views-chart";
import { TopProducts } from "@/modules/analytics/components/analytics/top-products";
import { TrafficChart } from "@/modules/analytics/components/analytics/traffic-chart";
import { ViewsChart } from "@/modules/analytics/components/analytics/views-chart";
import {
  PeakTimes,
  PeriodComparison,
  QuietProducts,
  SearchTerms,
  TopCategories,
  VisitSources,
} from "@/modules/analytics/components/analytics/insight-cards";
import { EmptyState } from "@/core/components/common/empty-state";
import { ErrorState } from "@/core/components/common/error-state";
import { LoadingState } from "@/core/components/common/loading-state";
import type { AnalyticsSummary, ChartPoint, DeviceStat, ProductViewStat } from "@/modules/analytics/types";
import { ChartIcon } from "@/core/ui/icons";

export function AnalyticsOverview({
  summary,
  menuViews = [],
  productViews = [],
  qrScans = [],
  shares = [],
  searches = [],
  topProducts = [],
  devices = [],
  sources = { link: 0, qr: 0 },
  comparison = { current: 0, previous: 0 },
  hours = [],
  busiestHour = null,
  busiestDay = null,
  categories = [],
  searchTerms = [],
  quietProducts = [],
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
  sources?: { link: number; qr: number };
  comparison?: { current: number; previous: number };
  hours?: ChartPoint[];
  busiestHour?: string | null;
  busiestDay?: string | null;
  categories?: { name: string; views: number }[];
  searchTerms?: { term: string; count: number }[];
  quietProducts?: { id: string; name: string }[];
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
        <VisitSources link={sources.link} qr={sources.qr} />
        <PeriodComparison current={comparison.current} previous={comparison.previous} />
      </div>
      <PeakTimes hours={hours} busiestHour={busiestHour} busiestDay={busiestDay} />
      <div className="grid gap-4 lg:grid-cols-2">
        <ViewsChart points={menuViews} />
        <ProductViewsChart points={productViews} />
      </div>
      <TrafficChart qrScans={qrScans} shares={shares} searches={searches} />
      <div className="grid gap-4 lg:grid-cols-2">
        <TopCategories rows={categories} />
        <SearchTerms rows={searchTerms} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TopProducts items={topProducts} />
        <QuietProducts products={quietProducts} />
      </div>
      <DeviceStatistics items={devices} />
    </div>
  );
}
