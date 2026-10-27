import { AnalyticsChart } from "@/modules/analytics/components/analytics/analytics-chart";
import type { ChartPoint } from "@/modules/analytics/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";

export function ViewsChart({
  points,
  className,
}: {
  points: ChartPoint[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>مشاهدات المنيو</CardTitle>
      </CardHeader>
      <CardContent>
        <AnalyticsChart points={points} type="line" emptyLabel="لا توجد مشاهدات في هذه الفترة" />
      </CardContent>
    </Card>
  );
}
