import { getAdminPlans } from "@/modules/billing/actions/billing";
import { AdminPlansView } from "@/modules/billing/views/admin-plans-view";
import { ErrorState } from "@/core/components/common/error-state";
import { requirePlatformAdmin } from "@/core/auth/authorization";

export default async function AdminPlansPage() {
  await requirePlatformAdmin("/admin/plans");
  const plans = await getAdminPlans();
  if (plans.error) return <ErrorState description={plans.error} />;
  return <AdminPlansView plans={plans.data ?? []} />;
}
