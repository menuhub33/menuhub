"use client";

import { useState, useTransition } from "react";
import { FormField } from "@/core/components/forms/form-field";
import { PageHeader } from "@/core/components/layout/page-header";
import { formatAmount, formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { Select } from "@/core/ui/select";
import { useToast } from "@/core/ui/toast";
import { loadSalesReports } from "@/modules/sales/actions/reports";
import type { ProfitColumns, ReportPeriod, SalesReports } from "@/modules/sales/report-types";

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "اليوم" },
  { value: "yesterday", label: "أمس" },
  { value: "last_7_days", label: "آخر 7 أيام" },
  { value: "last_30_days", label: "آخر 30 يوماً" },
  { value: "this_month", label: "هذا الشهر" },
  { value: "last_month", label: "الشهر الماضي" },
  { value: "custom", label: "فترة مخصصة" },
];

const CHANNEL_LABELS: Record<string, string> = {
  POS: "نقطة البيع",
  QR: "منيو QR",
  STAFF: "النادل",
  EXTERNAL: "خارجي",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  DINE_IN: "داخل المطعم",
  TAKEAWAY: "سفري",
  DELIVERY: "توصيل",
};

const METHOD_LABELS: Record<string, string> = {
  CASH: "نقداً",
  CARD: "بطاقة",
  OTHER: "أخرى",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function PosReportsView({
  initial,
  branchScoped = false,
}: {
  initial: SalesReports;
  /** A member pinned to one branch only ever sees that branch. */
  branchScoped?: boolean;
}) {
  const { toast } = useToast();
  const [reports, setReports] = useState(initial);
  const [period, setPeriod] = useState<ReportPeriod>("today");
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [pending, startTransition] = useTransition();

  const currency = reports.summary.currency;
  const money = (value: number) => formatPrice(value, currency);

  function refresh(next: { period: ReportPeriod; from?: string; to?: string }) {
    startTransition(async () => {
      const result = await loadSalesReports(next);
      if (result.error || !result.data) {
        toast({ title: result.error ?? "تعذر تحميل التقارير", variant: "error" });
        return;
      }
      setReports(result.data);
    });
  }

  function changePeriod(value: string) {
    const next = value as ReportPeriod;
    setPeriod(next);
    if (next !== "custom") refresh({ period: next });
  }

  const { summary } = reports;
  const peak = Math.max(1, ...reports.timeseries.map((point) => point.sales_total));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="تقارير نقطة البيع"
        description="المبيعات بحسب الفواتير المؤكدة، والتحصيل بحسب الدفعات الفعلية. الأرقام بعملة المحل."
      />

      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="w-48">
          <FormField label="الفترة" htmlFor="report-period">
            <Select id="report-period" value={period} onChange={changePeriod} options={PERIODS} />
          </FormField>
        </div>
        {period === "custom" ? (
          <>
            <div className="w-44">
              <FormField label="من" htmlFor="report-from">
                <Input id="report-from" type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} />
              </FormField>
            </div>
            <div className="w-44">
              <FormField label="إلى" htmlFor="report-to">
                <Input id="report-to" type="date" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} />
              </FormField>
            </div>
            <Button loading={pending} onClick={() => refresh({ period: "custom", from, to })}>
              عرض
            </Button>
          </>
        ) : (
          <Button variant="outline" loading={pending} onClick={() => refresh({ period })}>
            تحديث
          </Button>
        )}
        {branchScoped ? <p className="text-xs text-zinc-500">التقرير يخص فرعك فقط.</p> : null}
      </section>

      {summary.orders_needing_pricing > 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {summary.orders_needing_pricing} فاتورة تحوي أصنافاً بلا سعر، ولا تدخل تفاصيلها في تقارير المنتجات والأقسام.
        </p>
      ) : null}
      {summary.uncosted_items_count > 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {summary.uncosted_items_count} بنداً مباعاً بلا سعر تكلفة، ولا يدخل في حساب الربح (الربح محسوب على{" "}
          {summary.cost_coverage_percent}% من المبيعات). أضف سعر التكلفة في صفحة تعديل المنتج.
        </p>
      ) : null}
      {summary.excluded_other_currency_orders > 0 ? (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {summary.excluded_other_currency_orders} طلباً بعملة مختلفة عن عملة المحل مستبعدة من الأرقام.
        </p>
      ) : null}

      <div className={pending ? "grid gap-6 opacity-60 transition-opacity" : "grid gap-6 transition-opacity"}>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="إجمالي المبيعات" value={money(summary.sales_total)} />
          <Kpi label="عدد الفواتير" value={formatAmount(summary.invoices_count)} />
          <Kpi label="متوسط الفاتورة" value={money(summary.average_invoice)} />
          <Kpi label="فواتير ملغاة" value={formatAmount(summary.cancelled_count)} />
          <Kpi
            label="الربح الصافي"
            value={money(summary.profit_total)}
            hint={`بعد تكلفة المنتجات · هامش ${summary.profit_margin_percent}%`}
            highlight
          />
          <Kpi label="تكلفة المنتجات" value={money(summary.cost_total)} />
          <Kpi label="المحصّل" value={money(summary.collections_total)} />
          <Kpi label="المرتجعات" value={money(summary.refunds_total)} />
          <Kpi label="صافي التحصيل" value={money(summary.net_collections)} highlight />
          <Kpi
            label="غير محصّل (ذمم)"
            value={money(summary.unpaid_total)}
            hint={`${formatAmount(summary.unpaid_invoices_count)} فاتورة`}
          />
        </section>

        <Card title="المبيعات عبر الفترة">
          {reports.timeseries.length === 0 ? (
            <Empty />
          ) : (
            <ul className="grid gap-2">
              {reports.timeseries.map((point) => (
                <li key={point.bucket} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-zinc-500" dir="ltr">
                    {point.bucket}
                  </span>
                  <span className="h-3 overflow-hidden rounded-full bg-zinc-100">
                    <span
                      className="block h-full rounded-full bg-teal-600"
                      style={{ width: `${Math.max(2, (point.sales_total / peak) * 100)}%` }}
                    />
                  </span>
                  <span className="whitespace-nowrap text-zinc-800">
                    {money(point.sales_total)}
                    <span className="ms-2 text-xs text-zinc-400">({point.invoices_count})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="حسب القناة">
            <Rows
              empty={reports.channels.length === 0}
              head={["القناة", "الفواتير", "المبيعات", "%"]}
              rows={reports.channels.map((row) => [
                CHANNEL_LABELS[row.channel] ?? row.channel,
                formatAmount(row.invoices_count),
                money(row.sales_total),
                `${row.share_percent}%`,
              ])}
            />
          </Card>
          <Card title="حسب نوع الطلب">
            <Rows
              empty={reports.orderTypes.length === 0}
              head={["النوع", "الفواتير", "المبيعات", "%"]}
              rows={reports.orderTypes.map((row) => [
                ORDER_TYPE_LABELS[row.order_type] ?? row.order_type,
                formatAmount(row.invoices_count),
                money(row.sales_total),
                `${row.share_percent}%`,
              ])}
            />
          </Card>
          <Card title="طرق الدفع (المحصّل فعلياً)">
            <Rows
              empty={reports.paymentMethods.length === 0}
              head={["الطريقة", "العمليات", "المحصّل", "%"]}
              rows={reports.paymentMethods.map((row) => [
                METHOD_LABELS[row.method] ?? row.method,
                formatAmount(row.operations_count),
                money(row.collections_total),
                `${row.share_percent}%`,
              ])}
            />
          </Card>
          <Card title="الأقسام">
            <Rows
              empty={reports.categories.length === 0}
              head={["القسم", "الكمية", "المبيعات", "%", "الربح"]}
              rows={reports.categories.map((row) => [
                row.category,
                formatAmount(row.quantity_sold),
                money(row.sales_total),
                `${row.share_percent}%`,
                profitCell(row, money),
              ])}
            />
          </Card>
        </div>

        <Card title="الأكثر مبيعاً">
          <Rows
            empty={reports.topProducts.length === 0}
            head={["المنتج", "الكمية المباعة", "المبيعات", "التكلفة", "الربح"]}
            rows={reports.topProducts.map((row) => [
              row.name,
              formatAmount(row.quantity_sold),
              money(row.sales_total),
              row.profit_total == null ? "—" : money(row.cost_total),
              profitCell(row, money),
            ])}
          />
        </Card>

        <Card title="الموظفون (ما باعه كل موظف وما حصّله)">
          <Rows
            empty={reports.staff.length === 0}
            head={["الموظف", "الطلبات", "المبيعات", "المحصّل", "المرتجع"]}
            rows={reports.staff.map((row) => [
              row.name ?? "—",
              formatAmount(row.orders_count),
              money(row.sales_total),
              money(row.collections_total),
              money(row.refunds_total),
            ])}
          />
        </Card>

        {branchScoped ? null : (
          <Card title="الفروع">
            <Rows
              empty={reports.branches.length === 0}
              head={["الفرع", "الفواتير", "المبيعات", "المحصّل", "متوسط الفاتورة"]}
              rows={reports.branches.map((row) => [
                row.branch_name ?? "بدون فرع",
                formatAmount(row.invoices_count),
                money(row.sales_total),
                money(row.collections_total),
                money(row.average_invoice),
              ])}
            />
          </Card>
        )}
      </div>
    </div>
  );
}

/** Profit of a group; a trailing * flags groups where some items were sold without a known cost. */
function profitCell(row: ProfitColumns, money: (value: number) => string) {
  if (row.profit_total == null) return "—";
  return row.has_uncosted_items ? `${money(row.profit_total)} *` : money(row.profit_total);
}

function Kpi({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-2xl border border-teal-200 bg-teal-50 p-4"
          : "rounded-2xl border border-zinc-200 bg-white p-4"
      }
    >
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-zinc-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h2>
      {children}
    </section>
  );
}

function Empty() {
  return <p className="py-4 text-center text-sm text-zinc-400">لا توجد بيانات في هذه الفترة.</p>;
}

function Rows({ head, rows, empty }: { head: string[]; rows: string[][]; empty: boolean }) {
  if (empty) return <Empty />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-zinc-500">
          <tr>
            {head.map((cell) => (
              <th key={cell} className="p-2 text-start font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-zinc-100">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="p-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
