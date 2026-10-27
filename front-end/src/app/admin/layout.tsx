import { AdminShell } from "@/core/components/layout/admin-shell";
import { requirePlatformAdmin } from "@/core/auth/authorization";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requirePlatformAdmin("/admin");
  return <AdminShell profile={session.profile}>{children}</AdminShell>;
}
