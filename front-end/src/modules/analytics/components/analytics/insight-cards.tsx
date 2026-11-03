import { AnalyticsChart } from "@/modules/analytics/components/analytics/analytics-chart";
import { EmptyState } from "@/core/components/common/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { ChartIcon } from "@/core/ui/icons";
import type { ChartPoint } from "@/modules/analytics/types";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ar").format(value);
}

function NameCountCards({ rows }: { rows: { key: string; label: string; value: number }[] }) {
  return (
    <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
      {rows.map((row) => (
        <li
          key={row.key}
          className="flex min-w-0 items-center justify-between gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1"
        >
          <span className="truncate text-xs font-medium text-zinc-800">{row.label}</span>
          <span className="shrink-0 rounded-md bg-white px-1.5 text-[11px] font-semibold tabular-nums leading-5 text-teal-800">
            {formatCount(row.value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function RankedList({
  title,
  emptyTitle,
  emptyDescription,
  rows,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  rows: { key: string; label: string; value: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState title={emptyTitle} description={emptyDescription} icon={<ChartIcon className="size-7" />} />
        ) : (
          <NameCountCards rows={rows} />
        )}
      </CardContent>
    </Card>
  );
}

export function VisitSources({ link, qr }: { link: number; qr: number }) {
  const total = link + qr;
  const rows = [
    { key: "link", label: "من الرابط", value: link },
    { key: "qr", label: "من رمز QR", value: qr },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>مصدر الزيارة</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState
            title="لا زيارات في هذه الفترة"
            description="ستظهر هنا نسبة من فتح الرابط ومن مسح رمز QR."
            icon={<ChartIcon className="size-7" />}
          />
        ) : (
          <ul className="grid gap-4">
            {rows.map((row) => {
              const share = Math.round((row.value / total) * 100);
              return (
                <li key={row.key} className="grid gap-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-zinc-800">{row.label}</span>
                    <span className="tabular-nums text-zinc-500">
                      {formatCount(row.value)} · {formatCount(share)}٪
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-teal-700" style={{ width: `${share}%` }} />
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

export function PeriodComparison({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous;
  const percent = previous === 0 ? null : Math.round((delta / previous) * 100);
  const tone = delta > 0 ? "text-teal-700" : delta < 0 ? "text-red-600" : "text-zinc-500";
  const change =
    percent === null
      ? current === 0
        ? "لا مشاهدات في الفترتين"
        : "لا مشاهدات في الفترة السابقة"
      : `${percent > 0 ? "+" : ""}${formatCount(percent)}٪ عن الفترة السابقة`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>مقارنة بالفترة السابقة</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-500">مشاهدات المنيو</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{formatCount(current)}</p>
        <p className={`mt-2 text-sm font-medium ${tone}`}>{change}</p>
        <p className="mt-1 text-xs text-zinc-400">الفترة السابقة: {formatCount(previous)}</p>
      </CardContent>
    </Card>
  );
}

export function PeakTimes({
  hours,
  busiestHour,
  busiestDay,
}: {
  hours: ChartPoint[];
  busiestHour: string | null;
  busiestDay: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>أوقات الذروة</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {hours.length === 0 ? (
          <EmptyState
            title="لا زيارات في هذه الفترة"
            description="ستظهر هنا الساعة واليوم اللذان يُفتح فيهما المنيو أكثر."
            icon={<ChartIcon className="size-7" />}
          />
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-2">
              <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                أكثر ساعة: <span className="font-semibold text-zinc-900">{busiestHour}</span>
              </p>
              <p className="rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                أكثر يوم: <span className="font-semibold text-zinc-900">{busiestDay}</span>
              </p>
            </div>
            <AnalyticsChart points={hours} type="bar" emptyLabel="لا زيارات في هذه الفترة" />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function TopCategories({ rows }: { rows: { name: string; views: number }[] }) {
  return (
    <RankedList
      title="الأقسام الأكثر مشاهدة"
      emptyTitle="لا مشاهدات أقسام"
      emptyDescription="ستظهر هنا الأقسام التي فُتحت منتجاتها أكثر."
      rows={rows.map((row) => ({ key: row.name, label: row.name, value: row.views }))}
    />
  );
}

export function SearchTerms({ rows }: { rows: { term: string; count: number }[] }) {
  return (
    <RankedList
      title="كلمات البحث"
      emptyTitle="لا عمليات بحث بعد"
      emptyDescription="ستظهر هنا الكلمات التي يكتبها الزائر في بحث المنيو."
      rows={rows.map((row) => ({ key: row.term, label: row.term, value: row.count }))}
    />
  );
}

export function QuietProducts({ products }: { products: { id: string; name: string }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>منتجات لم تُفتح</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <EmptyState
            title="كل المنتجات فُتحت"
            description="لا يوجد منتج ظاهر بلا مشاهدات في هذه الفترة."
            icon={<ChartIcon className="size-7" />}
          />
        ) : (
          <NameCountCards
            rows={products.map((product) => ({ key: product.id, label: product.name, value: 0 }))}
          />
        )}
      </CardContent>
    </Card>
  );
}
