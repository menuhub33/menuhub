import { getAdminPlans, getPosPricing } from "@/modules/billing/actions/billing";
import { AdminPlansView } from "@/modules/billing/views/admin-plans-view";
import { ErrorState } from "@/core/components/common/error-state";
import { requirePlatformAdmin } from "@/core/auth/authorization";

export default async function AdminPlansPage() {
  await requirePlatformAdmin("/admin/plans");
  const [plans, posPricing] = await Promise.all([getAdminPlans(), getPosPricing()]);
  if (plans.error) return <ErrorState description={plans.error} />;
  if (posPricing.error || !posPricing.data) return <ErrorState description={posPricing.error ?? undefined} />;
  return <AdminPlansView plans={plans.data ?? []} posPricing={posPricing.data} />;
}
