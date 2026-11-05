import { EmptyState } from "@/core/components/common/empty-state";
import { PageHeader } from "@/core/components/layout/page-header";
import { formatDateTime } from "@/core/lib/format";
import type { BreadcrumbItem } from "@/core/lib/types";
import { Card } from "@/core/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/core/ui/table";
import type { ProductComplaint } from "@/modules/orders/types";

export type ComplaintRow = ProductComplaint & {
  restaurant?: { id: string; name: string; slug: string };
};

export function ComplaintsView({
  rows,
  showRestaurant = false,
  description,
  breadcrumbs,
}: {
  rows: ComplaintRow[];
  showRestaurant?: boolean;
  description: string;
  breadcrumbs: BreadcrumbItem[];
}) {
  return (
    <div className="grid gap-6">
      <PageHeader title="الشكاوي" description={description} breadcrumbs={breadcrumbs} />
      {rows.length === 0 ? (
        <Card>
          <EmptyState
            title="لا توجد شكاوى"
            description="عندما يرسل الزبون اسم المنتج وشرح المشكلة تظهر الشكوى هنا."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {showRestaurant ? <TableHead>المحل</TableHead> : null}
                <TableHead>اسم المنتج</TableHead>
                <TableHead>شرح المشكلة</TableHead>
                <TableHead>التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {showRestaurant ? (
                    <TableCell className="font-medium text-zinc-900">{row.restaurant?.name ?? "—"}</TableCell>
                  ) : null}
                  <TableCell className="font-medium text-zinc-900">{row.product_name}</TableCell>
                  <TableCell className="max-w-md whitespace-pre-wrap text-zinc-600">{row.description}</TableCell>
                  <TableCell className="whitespace-nowrap text-zinc-500">
                    {row.created_at ? formatDateTime(row.created_at) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
