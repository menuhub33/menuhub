import { getAdminFinance } from "@/modules/finance/actions/finance";
import { ErrorState } from "@/core/components/common/error-state";
import { AdminFinanceView } from "@/modules/finance/views/admin-finance-view";

export default async function AdminFinancePage() {
  const result = await getAdminFinance();
  if (result.error || !result.data) {
    return <ErrorState description={result.error ?? "تعذر تحميل البيانات المالية"} />;
  }
  return (
    <AdminFinanceView contracts={result.data.contracts} restaurants={result.data.restaurants} />
  );
}
