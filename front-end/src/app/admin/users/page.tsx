import { getAdminUsers } from "@/modules/platform/actions/admin";
import { AdminUsersView } from "@/modules/platform/views/admin-users-view";
import { ErrorState } from "@/core/components/common/error-state";
import { requirePlatformAdmin } from "@/core/auth/authorization";

export default async function AdminUsersPage() {
  const session = await requirePlatformAdmin("/admin/users");
  const users = await getAdminUsers();
  if (users.error) return <ErrorState description={users.error} />;
  return <AdminUsersView users={users.data ?? []} currentUserId={session.user.id} />;
}
