import { cn } from "@/components/lib/cn";
import { EmptyState } from "@/components/common/empty-state";
import type { DeviceStat } from "@/components/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartIcon } from "@/components/ui/icons";

const DEVICE_LABELS: Record<string, string> = {
  mobile: "جوّال",
  phone: "جوّال",
  smartphone: "جوّال",
  tablet: "جهاز لوحي",
  desktop: "سطح المكتب",
  computer: "سطح المكتب",
};

function deviceLabel(device: string): string {
  return DEVICE_LABELS[device.trim().toLowerCase()] ?? device;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("ar").format(value);
}

export function DeviceStatistics({
  items,
  className,
}: {
  items: DeviceStat[];
  className?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...items.map((item) => item.count), 0);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>الأجهزة</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            title="لا توجد بيانات أجهزة"
            description="ستظهر هنا نسبة الزيارات حسب نوع الجهاز."
            icon={<ChartIcon className="size-7" />}
          />
        ) : (
          <ul className="grid gap-4">
            {items.map((item) => {
              const percent = max === 0 ? 0 : Math.round((item.count / max) * 100);
              const share = total === 0 ? 0 : Math.round((item.count / total) * 100);
              return (
                <li key={item.device} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-zinc-800">{deviceLabel(item.device)}</span>
                    <span className="tabular-nums text-zinc-500">
                      {formatCount(item.count)} · {formatCount(share)}٪
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-teal-700"
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
