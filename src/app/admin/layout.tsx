import Link from "next/link";
import { logout } from "@/actions/auth/logout";
import { requirePlatformAdmin } from "@/lib/auth/authorization";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/restaurants", label: "المطاعم" },
  { href: "/admin/users", label: "المستخدمون" },
  { href: "/admin/subscriptions", label: "الاشتراكات" },
  { href: "/admin/plans", label: "الخطط" },
  { href: "/admin/payments", label: "المدفوعات" },
  { href: "/admin/analytics", label: "الإحصائيات" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requirePlatformAdmin("/admin");
  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="flex items-center gap-4 border-b border-zinc-200 bg-white px-4 py-3">
        <Link href="/admin" className="font-bold text-teal-800">
          MenuHub Admin
        </Link>
        <nav className="flex flex-1 flex-wrap gap-2 text-sm">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-lg px-2 py-1 text-zinc-600 hover:bg-zinc-100">
              {link.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await logout();
            redirect("/login");
          }}
        >
          <Button variant="ghost" size="sm" type="submit">
            خروج
          </Button>
        </form>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
