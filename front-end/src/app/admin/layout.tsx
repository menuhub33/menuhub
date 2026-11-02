import { AdminShell } from "@/core/components/layout/admin-shell";
import { requireConsole } from "@/core/auth/authorization";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireConsole("/admin");
  return <AdminShell profile={session.profile}>{children}</AdminShell>;
}
