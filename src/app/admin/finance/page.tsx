import { getAdminFinance } from "@/actions/admin/finance";
import { ErrorState } from "@/components/common/error-state";
import { AdminFinanceView } from "@/components/views/admin-finance-view";
import { BILLING_SETUP_MESSAGE } from "@/lib/menu-billing";
import { Alert } from "@/components/ui/alert";

export default async function AdminFinancePage() {
  const result = await getAdminFinance();
  if (result.error === BILLING_SETUP_MESSAGE) {
    return (
      <Alert variant="warning" title="تجهيز الإدارة المالية">
        {BILLING_SETUP_MESSAGE}
      </Alert>
    );
  }
  if (result.error || !result.data) return <ErrorState description={result.error ?? "تعذر التحميل"} />;
  return (
    <AdminFinanceView contracts={result.data.contracts} restaurants={result.data.restaurants} />
  );
}
