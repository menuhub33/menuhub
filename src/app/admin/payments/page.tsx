import { getAdminPayments } from "@/actions/admin/admin";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentHistory } from "@/components/subscription/payment-history";
import { ErrorState } from "@/components/common/error-state";

export default async function AdminPaymentsPage() {
  const payments = await getAdminPayments();
  if (payments.error) return <ErrorState description={payments.error} />;
  return (
    <div className="grid gap-4">
      <PageHeader title="المدفوعات" />
      <PaymentHistory payments={payments.data ?? []} />
    </div>
  );
}
