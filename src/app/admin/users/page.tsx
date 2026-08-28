import { getAdminUsers } from "@/actions/admin/admin";
import { AdminUsersView } from "@/components/views/admin-users-view";
import { ErrorState } from "@/components/common/error-state";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  if (users.error) return <ErrorState description={users.error} />;
  return <AdminUsersView users={users.data ?? []} />;
}
