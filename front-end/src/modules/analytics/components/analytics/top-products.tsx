import { cn } from "@/core/lib/cn";
import { EmptyState } from "@/core/components/common/empty-state";
import type { ProductViewStat } from "@/modules/analytics/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { ChartIcon } from "@/core/ui/icons";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ar").format(value);
}

export function TopProducts({
  items,
  className,
}: {
  items: ProductViewStat[];
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>أكثر المنتجات مشاهدة</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="لا توجد مشاهدات بعد"
            description="ستظهر هنا المنتجات الأكثر مشاهدة."
            icon={<ChartIcon className="size-7" />}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {items.map((item) => (
              <li
                key={item.product.id}
                className="flex min-w-0 items-center justify-between gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1"
              >
                <span className="truncate text-xs font-medium text-zinc-800">{item.product.name_ar}</span>
                <span className="shrink-0 rounded-md bg-white px-1.5 text-[11px] font-semibold tabular-nums leading-5 text-teal-800">
                  {formatCount(item.views)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
