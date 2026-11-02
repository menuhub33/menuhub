import { requirePlatformAdmin } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";
import { getAdminMalls } from "@/modules/malls/actions/malls";
import { AdminMallsView } from "@/modules/malls/views/admin-malls-view";

export default async function AdminMallsPage() {
  await requirePlatformAdmin("/admin/malls");
  const malls = await getAdminMalls();
  if (malls.error) return <ErrorState description={malls.error} />;
  return <AdminMallsView malls={malls.data ?? []} />;
}
