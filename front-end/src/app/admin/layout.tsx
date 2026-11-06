import { AdminShell } from "@/core/components/layout/admin-shell";
import { requireConsole } from "@/core/auth/authorization";
import { getNotification } from "@/modules/notifications/actions/notifications";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireConsole("/admin");
  const notifications = await getNotification({ audience: "mall" });
  return (
    <AdminShell profile={session.profile} notifications={notifications.data ?? []}>
      {children}
    </AdminShell>
  );
}
