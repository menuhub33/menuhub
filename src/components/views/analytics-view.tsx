"use client";

import { useMemo, useState } from "react";
import { AnalyticsOverview } from "@/components/analytics/analytics-overview";
import { PageHeader } from "@/components/layout/page-header";
import type { AnalyticsEvent, Product } from "@/lib/types";
import type { DateRangeValue } from "@/components/analytics/analytics-date-range";

function isoDay(value: string) {
  return value.slice(0, 10);
}

export function AnalyticsView({
  events,
  products,
  initialFrom,
  initialTo,
}: {
  events: AnalyticsEvent[];
  products: Pick<Product, "id" | "name_ar" | "name_en" | "price" | "currency">[];
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

  return (
    <div className="grid gap-6">
      <PageHeader
        title="الإحصائيات"
        description="مشاهدات المنيو والمنتجات والأجهزة."
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
      />
      <p className="text-sm text-zinc-500">الزوار الفريدون في الفترة: {unique}</p>
    </div>
  );
}
