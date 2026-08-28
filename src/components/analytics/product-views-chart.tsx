import { AnalyticsChart } from "@/components/analytics/analytics-chart";
import type { ChartPoint } from "@/components/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProductViewsChart({
  points,
  className,
}: {
  points: ChartPoint[];
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>مشاهدات المنتجات</CardTitle>
      </CardHeader>
      <CardContent>
        <AnalyticsChart points={points} type="bar" emptyLabel="لا توجد مشاهدات منتجات في هذه الفترة" />
      </CardContent>
    </Card>
  );
}
