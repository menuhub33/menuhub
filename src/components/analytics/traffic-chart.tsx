"use client";

import { useState } from "react";
import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import type { ChartPoint } from "@/components/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";

const TABS = [
  { id: "QR_SCAN", label: "مسح QR" },
  { id: "SHARE", label: "مشاركات" },
  { id: "SEARCH", label: "بحث" },
] as const;

type TrafficTab = (typeof TABS)[number]["id"];

export function TrafficChart({
  qrScans,
  shares,
  searches,
  className,
}: {
  qrScans: ChartPoint[];
  shares: ChartPoint[];
  searches: ChartPoint[];
  className?: string;
}) {
  const [tab, setTab] = useState<TrafficTab>("QR_SCAN");

  const series: Record<TrafficTab, ChartPoint[]> = {
    QR_SCAN: qrScans,
    SHARE: shares,
    SEARCH: searches,
  };

  const emptyLabels: Record<TrafficTab, string> = {
    QR_SCAN: "لا توجد عمليات مسح في هذه الفترة",
    SHARE: "لا توجد مشاركات في هذه الفترة",
    SEARCH: "لا توجد عمليات بحث في هذه الفترة",
  };

  return (
    <Card className={className}>
      <CardHeader className="gap-3">
        <CardTitle>حركة الزيارات</CardTitle>
        <Tabs
          tabs={TABS.map((item) => ({ id: item.id, label: item.label }))}
          value={tab}
          onChange={(id) => {
            if (id === "QR_SCAN" || id === "SHARE" || id === "SEARCH") setTab(id);
          }}
        />
      </CardHeader>
      <CardContent>
        <AnalyticsChart points={series[tab]} type="line" emptyLabel={emptyLabels[tab]} />
      </CardContent>
    </Card>
  );
}
