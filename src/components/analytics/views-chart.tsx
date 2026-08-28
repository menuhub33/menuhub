import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import type { ChartPoint } from "@/components/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
