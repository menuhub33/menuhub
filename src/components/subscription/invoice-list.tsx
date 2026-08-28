import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { formatDate, formatPrice } from "@/components/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Invoice } from "@/lib/types";

const INVOICE_STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  PAID: { label: "مدفوعة", variant: "success" },
  PENDING: { label: "قيد الانتظار", variant: "warning" },
  OVERDUE: { label: "متأخرة", variant: "danger" },
  DRAFT: { label: "مسودة", variant: "default" },
  VOID: { label: "ملغاة", variant: "default" },
  CANCELLED: { label: "ملغاة", variant: "default" },
  FAILED: { label: "فشل", variant: "danger" },
};

function invoiceStatus(status: string) {
  const key = status.toUpperCase();
  return INVOICE_STATUS[key] ?? { label: status, variant: "default" as const };
}

function isOverdue(invoice: Invoice): boolean {
  if (invoice.status.toUpperCase() === "PAID") return false;
  if (!invoice.due_date) return false;
  return new Date(invoice.due_date).getTime() < Date.now();
}

export function InvoiceList({
  invoices,
  loading,
  error,
  onRetry,
}: {
  invoices: Invoice[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <LoadingState label="جارٍ تحميل الفواتير..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (invoices.length === 0) {
    return <EmptyState title="لا توجد فواتير" description="ستظهر الفواتير هنا عند إصدارها." />;
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:hidden">
        {invoices.map((invoice) => {
          const status = invoiceStatus(isOverdue(invoice) ? "OVERDUE" : invoice.status);
          return (
            <Card key={invoice.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-semibold text-zinc-900" dir="ltr">
                    {invoice.invoice_number}
                  </p>
                  <p className="mt-1 text-base font-bold text-zinc-900">
                    {formatPrice(invoice.total, invoice.currency)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    الاستحقاق: {invoice.due_date ? formatDate(invoice.due_date) : "غير محدد"}
                  </p>
                </div>
                <Badge variant={status.variant} dot>
                  {status.label}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الفاتورة</TableHead>
              <TableHead>الإجمالي</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>تاريخ الاستحقاق</TableHead>
              <TableHead>تاريخ الدفع</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const status = invoiceStatus(isOverdue(invoice) ? "OVERDUE" : invoice.status);
              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <span className="font-mono text-sm" dir="ltr">
                      {invoice.invoice_number}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(invoice.total, invoice.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={status.variant} dot>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {invoice.due_date ? formatDate(invoice.due_date) : "—"}
                  </TableCell>
                  <TableCell className="text-zinc-500">
                    {invoice.paid_at ? formatDate(invoice.paid_at) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
