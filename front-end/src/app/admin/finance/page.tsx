import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { getAdminFinance } from "@/modules/finance/actions/finance";
import { ErrorState } from "@/core/components/common/error-state";
import { AdminFinanceView } from "@/modules/finance/views/admin-finance-view";

export default async function AdminFinancePage() {
  const session = await requireConsole("/admin/finance");
  const mallOnly = Boolean(session.profile.mall) && !isPlatformAdmin(session.profile.platform_role);
  const result = await getAdminFinance();
  if (result.error || !result.data) {
    return <ErrorState description={result.error ?? "تعذر تحميل البيانات المالية"} />;
  }
  return (
    <AdminFinanceView
      contracts={result.data.contracts}
      restaurants={result.data.restaurants}
      mallName={mallOnly ? session.profile.mall?.name : null}
    />
  );
}
