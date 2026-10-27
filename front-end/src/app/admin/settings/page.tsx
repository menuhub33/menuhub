import { getReservedSubdomain } from "@/modules/platform/actions/reserved-subdomains";
import { ErrorState } from "@/core/components/common/error-state";
import { AdminSettingsView } from "@/modules/platform/views/admin-settings-view";
import type { ReservedSubdomain } from "@/modules/tenancy/types";

export default async function AdminSettingsPage() {
  const reserved = await getReservedSubdomain();
  if (reserved.error) return <ErrorState description={reserved.error} />;
  const list = (
    Array.isArray(reserved.data) ? reserved.data : reserved.data ? [reserved.data] : []
  ) as ReservedSubdomain[];
  return <AdminSettingsView items={list} />;
}
