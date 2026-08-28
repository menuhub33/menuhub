import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import { EmptyState } from "@/components/common/empty-state";
import type { ProductViewStat } from "@/components/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartIcon } from "@/components/ui/icons";

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
  const maxViews = Math.max(...items.map((item) => item.views), 0);

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
          <ul className="grid gap-4">
            {items.map((item) => {
              const percent = maxViews === 0 ? 0 : Math.round((item.views / maxViews) * 100);
              return (
                <li key={item.product.id} className="grid gap-2">
                  <div className="flex items-center gap-3">
                    <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center text-xs text-zinc-400">
                          {item.product.name_ar.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900">
                        {item.product.name_ar}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatPrice(item.product.price, item.product.currency)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-teal-800">
                      {formatCount(item.views)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-teal-700 transition-[width]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
