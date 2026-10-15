import { getReservedSubdomain } from "@/actions/reserved-subdomains/getReservedSubdomain";
import { ErrorState } from "@/components/common/error-state";
import { AdminSettingsView } from "@/components/views/admin-settings-view";
import type { ReservedSubdomain } from "@/lib/types";

export default async function AdminSettingsPage() {
  const reserved = await getReservedSubdomain();
  if (reserved.error) return <ErrorState description={reserved.error} />;
  const list = (
    Array.isArray(reserved.data) ? reserved.data : reserved.data ? [reserved.data] : []
  ) as ReservedSubdomain[];
  return <AdminSettingsView items={list} />;
}
