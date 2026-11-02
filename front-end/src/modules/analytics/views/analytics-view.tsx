"use client";

import { useMemo, useState } from "react";
import { AnalyticsOverview } from "@/modules/analytics/components/analytics/analytics-overview";
import { PageHeader } from "@/core/components/layout/page-header";
import type { AnalyticsEvent } from "@/modules/analytics/types";
import type { Product, ProductStatus } from "@/modules/catalog/types";
import type { DateRangeValue } from "@/modules/analytics/components/analytics/analytics-date-range";

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function isoDay(value: string) {
  return value.slice(0, 10);
}

function shiftDay(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(year, (month ?? 1) - 1, date ?? 1);
  next.setDate(next.getDate() + amount);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;
}

function spanDays(from: string, to: string) {
  const [fromYear, fromMonth, fromDate] = from.split("-").map(Number);
  const [toYear, toMonth, toDate] = to.split("-").map(Number);
  const start = new Date(fromYear, (fromMonth ?? 1) - 1, fromDate ?? 1);
  const end = new Date(toYear, (toMonth ?? 1) - 1, toDate ?? 1);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
}

function hourLabel(hour: number) {
  if (hour === 0) return "12 ص";
  if (hour < 12) return `${hour} ص`;
  if (hour === 12) return "12 م";
  return `${hour - 12} م`;
}

function inRange(event: AnalyticsEvent, from: string, to: string) {
  const day = isoDay(event.created_at);
  return day >= from && day <= to;
}

export function AnalyticsView({
  events,
  products,
  initialFrom,
  initialTo,
}: {
  events: AnalyticsEvent[];
  products: Array<
    Pick<Product, "id" | "name_ar" | "name_en" | "price" | "currency" | "status"> & {
      categoryName: string;
    }
  >;
  initialFrom: string;
  initialTo: string;
}) {
  const [range, setRange] = useState<DateRangeValue>({ from: initialFrom, to: initialTo });

  const filtered = useMemo(() => {
    return events.filter((event) => {
      const day = isoDay(event.created_at);
      return day >= range.from && day <= range.to;
    });
  }, [events, range]);

  const byDay = (type: AnalyticsEvent["event_type"]) => {
    const map = new Map<string, number>();
    for (const event of filtered.filter((item) => item.event_type === type)) {
      const day = isoDay(event.created_at);
      map.set(day, (map.get(day) ?? 0) + 1);
    }
    return [...map.entries()].map(([label, value]) => ({ label, value }));
  };

  const topMap = new Map<string, number>();
  for (const event of filtered.filter((item) => item.event_type === "PRODUCT_VIEW" && item.product_id)) {
    topMap.set(event.product_id!, (topMap.get(event.product_id!) ?? 0) + 1);
  }
  const topProducts = [...topMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, views]) => {
      const product = products.find((item) => item.id === id);
      return product ? { product, views } : null;
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const deviceMap = new Map<string, number>();
  for (const event of filtered) {
    const device = event.device_type || "غير معروف";
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + 1);
  }

  const unique = new Set(filtered.map((event) => event.visitor_id || event.session_id || event.id)).size;
  const menuVisits = filtered.filter((event) => event.event_type === "MENU_VIEW");
  const sources = menuVisits.reduce(
    (counts, event) => {
      if (event.metadata?.source === "qr") counts.qr += 1;
      else counts.link += 1;
      return counts;
    },
    { link: 0, qr: 0 }
  );

  const length = Math.max(1, spanDays(range.from, range.to));
  const previousTo = shiftDay(range.from, -1);
  const previousFrom = shiftDay(previousTo, -(length - 1));
  const previousViews = events.filter(
    (event) => event.event_type === "MENU_VIEW" && inRange(event, previousFrom, previousTo)
  ).length;

  const hourCounts = new Array<number>(24).fill(0);
  const dayCounts = new Array<number>(7).fill(0);
  for (const event of menuVisits) {
    const stamp = new Date(event.created_at);
    if (Number.isNaN(stamp.getTime())) continue;
    hourCounts[stamp.getHours()] += 1;
    dayCounts[stamp.getDay()] += 1;
  }
  const hours = hourCounts
    .map((value, hour) => ({ label: hourLabel(hour), value, hour }))
    .filter((point) => point.value > 0);
  const busiestHour = hours.reduce<(typeof hours)[number] | null>(
    (best, point) => (best && best.value >= point.value ? best : point),
    null
  );
  const busiestDayIndex = dayCounts.reduce(
    (best, value, index) => (value > dayCounts[best] ? index : best),
    0
  );

  const categoryCounts = new Map<string, number>();
  const viewsByProduct = new Map<string, number>();
  for (const event of filtered.filter((item) => item.event_type === "PRODUCT_VIEW" && item.product_id)) {
    viewsByProduct.set(event.product_id!, (viewsByProduct.get(event.product_id!) ?? 0) + 1);
    const category = products.find((item) => item.id === event.product_id)?.categoryName ?? "بدون قسم";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }
  const categories = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, views]) => ({ name, views }));

  const searchCounts = new Map<string, number>();
  for (const event of filtered.filter((item) => item.event_type === "SEARCH")) {
    const term = String(event.metadata?.query ?? "").trim();
    if (term.length < 2) continue;
    searchCounts.set(term, (searchCounts.get(term) ?? 0) + 1);
  }
  const searchTerms = [...searchCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([term, count]) => ({ term, count }));

  const quiet = products.filter(
    (product) => product.status !== ("HIDDEN" satisfies ProductStatus) && (viewsByProduct.get(product.id) ?? 0) === 0
  );

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الإحصائيات"
        description="المشاهدات، مصدر الزيارة، أوقات الذروة، والأقسام والمنتجات."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "الإحصائيات" }]}
      />
      <AnalyticsOverview
        from={range.from}
        to={range.to}
        onRangeChange={setRange}
        summary={{
          menuViews: filtered.filter((event) => event.event_type === "MENU_VIEW").length,
          productViews: filtered.filter((event) => event.event_type === "PRODUCT_VIEW").length,
          qrScans: filtered.filter((event) => event.event_type === "QR_SCAN").length,
          shares: filtered.filter((event) => event.event_type === "SHARE").length,
          searches: filtered.filter((event) => event.event_type === "SEARCH").length,
        }}
        menuViews={byDay("MENU_VIEW")}
        productViews={byDay("PRODUCT_VIEW")}
        qrScans={byDay("QR_SCAN")}
        shares={byDay("SHARE")}
        searches={byDay("SEARCH")}
        topProducts={topProducts}
        devices={[...deviceMap.entries()].map(([device, count]) => ({ device, count }))}
        sources={sources}
        comparison={{ current: menuVisits.length, previous: previousViews }}
        hours={hours.map(({ label, value }) => ({ label, value }))}
        busiestHour={busiestHour?.label ?? null}
        busiestDay={menuVisits.length > 0 ? WEEKDAYS[busiestDayIndex] : null}
        categories={categories}
        searchTerms={searchTerms}
        quietProducts={quiet.slice(0, 8).map((product) => ({ id: product.id, name: product.name_ar }))}
        quietRemaining={Math.max(0, quiet.length - 8)}
      />
      <p className="text-sm text-zinc-500">الزوار الفريدون في الفترة: {unique}</p>
    </div>
  );
}
