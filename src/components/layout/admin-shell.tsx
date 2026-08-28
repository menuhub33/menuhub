"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/actions/auth/logout";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/cn";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "الرئيسية" },
  { href: "/admin/restaurants", label: "المطاعم" },
  { href: "/admin/users", label: "المستخدمون" },
  { href: "/admin/subscriptions", label: "الاشتراكات" },
  { href: "/admin/plans", label: "الخطط" },
  { href: "/admin/payments", label: "المدفوعات" },
  { href: "/admin/analytics", label: "الإحصائيات" },
  { href: "/admin/settings", label: "الإعدادات" },
];

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-dvh bg-zinc-50">
      <aside className="hidden w-60 shrink-0 border-e border-zinc-200 bg-white p-4 lg:block">
        <Link href="/admin" className="mb-6 block text-lg font-bold text-teal-800">
          MenuHub Admin
        </Link>
        <nav className="grid gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium",
                pathname === item.href ? "bg-teal-50 text-teal-800" : "text-zinc-600 hover:bg-zinc-50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4">
          <Link href="/admin" className="font-semibold text-teal-800 lg:hidden">
            Admin
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <span className="text-sm text-zinc-600">{profile.full_name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
            >
              خروج
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
