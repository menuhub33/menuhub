import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDateTime, formatPrice } from "@/components/lib/format";
import { Card } from "@/components/ui/card";
import { CreditCardIcon } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Payment } from "@/lib/types";

const METHOD_LABELS: Record<string, string> = {
  cash: "نقدي",
  card: "بطاقة",
  credit_card: "بطاقة ائتمان",
  bank: "تحويل بنكي",
  bank_transfer: "تحويل بنكي",
  wallet: "محفظة",
};

function methodLabel(method: string | null): string {
  if (!method) return "غير محدد";
  return METHOD_LABELS[method] ?? method;
}

export function PaymentHistory({
  payments,
  loading,
  error,
  onRetry,
}: {
  payments: Payment[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <LoadingState label="جارٍ تحميل المدفوعات..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (payments.length === 0) {
    return (
      <EmptyState
        title="لا توجد مدفوعات"
        description="ستظهر عمليات الدفع هنا بعد إتمام أول عملية."
        icon={<CreditCardIcon className="size-7" />}
      />
    );
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 md:hidden">
        {payments.map((payment) => (
          <Card key={payment.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-zinc-900">
                  {formatPrice(payment.amount, payment.currency)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">{methodLabel(payment.payment_method)}</p>
                <p className="mt-1 text-xs text-zinc-400">
                  {payment.paid_at ? formatDateTime(payment.paid_at) : formatDateTime(payment.created_at)}
                </p>
              </div>
              <StatusBadge kind="payment" value={payment.status} />
            </div>
            {payment.transaction_id ? (
              <p className="mt-3 truncate rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500" dir="ltr">
                {payment.transaction_id}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المبلغ</TableHead>
              <TableHead>الوسيلة</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>رقم العملية</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">
                  {formatPrice(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>{methodLabel(payment.payment_method)}</TableCell>
                <TableCell>
                  <StatusBadge kind="payment" value={payment.status} />
                </TableCell>
                <TableCell className="text-zinc-500">
                  {payment.paid_at ? formatDateTime(payment.paid_at) : formatDateTime(payment.created_at)}
                </TableCell>
                <TableCell>
                  {payment.transaction_id ? (
                    <span className="font-mono text-xs text-zinc-500" dir="ltr">
                      {payment.transaction_id}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
