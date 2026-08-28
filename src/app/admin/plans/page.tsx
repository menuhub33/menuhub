import { getAdminPlans } from "@/actions/admin/admin";
import { AdminPlansView } from "@/components/views/admin-plans-view";
import { ErrorState } from "@/components/common/error-state";

export default async function AdminPlansPage() {
  const plans = await getAdminPlans();
  if (plans.error) return <ErrorState description={plans.error} />;
  return <AdminPlansView plans={plans.data ?? []} />;
}
