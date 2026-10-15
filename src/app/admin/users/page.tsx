import { getAdminUsers } from "@/actions/admin/admin";
import { AdminUsersView } from "@/components/views/admin-users-view";
import { ErrorState } from "@/components/common/error-state";
import { requirePlatformAdmin } from "@/lib/auth/authorization";

export default async function AdminUsersPage() {
  const session = await requirePlatformAdmin("/admin/users");
  const users = await getAdminUsers();
  if (users.error) return <ErrorState description={users.error} />;
  return <AdminUsersView users={users.data ?? []} currentUserId={session.user.id} />;
}
