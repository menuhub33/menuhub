import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { getActivePlans, getPosPricing } from "@/modules/billing/actions/billing";
import { getAdminFinance } from "@/modules/finance/actions/finance";
import { ErrorState } from "@/core/components/common/error-state";
import { AdminFinanceView } from "@/modules/finance/views/admin-finance-view";

export default async function AdminFinancePage() {
  const session = await requireConsole("/admin/finance");
  const mallOnly = Boolean(session.profile.mall) && !isPlatformAdmin(session.profile.platform_role);
  const [result, plans, posPricing] = await Promise.all([
    getAdminFinance(),
    getActivePlans(),
    mallOnly ? Promise.resolve({ data: null, error: null }) : getPosPricing(),
  ]);
  if (result.error || !result.data) {
    return <ErrorState description={result.error ?? "تعذر تحميل البيانات المالية"} />;
  }
  return (
    <AdminFinanceView
      contracts={result.data.contracts}
      restaurants={result.data.restaurants}
      plans={(plans.data ?? []).map((plan) => ({
        id: plan.id,
        name: plan.name,
        price_yearly: plan.price_yearly,
        currency: plan.currency,
      }))}
      posPricing={posPricing.data}
      mallName={mallOnly ? session.profile.mall?.name : null}
    />
  );
}
