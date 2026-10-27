"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/modules/auth/actions/auth";
import { PLATFORM_ROLE_LABELS } from "@/core/lib/labels";
import { cn } from "@/core/lib/cn";
import { Button } from "@/core/ui/button";
import { Drawer } from "@/core/ui/drawer";
import {
  BuildingIcon,
  CreditCardIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  UsersIcon,
} from "@/core/ui/icons";
import type { Profile } from "@/modules/auth/types";

const NAV = [
  { href: "/admin", label: "الرئيسية", icon: HomeIcon, exact: true },
  { href: "/admin/restaurants", label: "المطاعم", icon: BuildingIcon },
  { href: "/admin/finance", label: "الإدارة المالية", icon: CreditCardIcon },
  { href: "/admin/users", label: "المستخدمون", icon: UsersIcon },
  { href: "/admin/settings", label: "الإعدادات", icon: SettingsIcon },
];

function isActive(href: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function AdminNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="grid gap-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href, pathname, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-teal-50 text-teal-800"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            <Icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // The drawer is "open for" one pathname, so it closes itself on navigation.
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname;
  const setOpen = (value: boolean) => setOpenFor(value ? pathname : null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/login");
    router.refresh();
  }

  const footer = (
    <div className="border-t border-zinc-100 p-3">
      <p className="truncate px-2 text-sm font-medium text-zinc-900">
        {profile.full_name ?? "مدير المنصة"}
      </p>
      <p className="mb-3 truncate px-2 text-xs text-zinc-500">
        {PLATFORM_ROLE_LABELS[profile.platform_role]}
      </p>
      <Button
        variant="outline"
        className="w-full"
        loading={loggingOut}
        onClick={() => void handleLogout()}
      >
        <LogOutIcon className="size-4" />
        تسجيل الخروج
      </Button>
    </div>
  );

  return (
    <div className="flex min-h-dvh bg-zinc-50">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-zinc-200 bg-white lg:flex">
        <Link href="/admin" className="block px-5 py-5 text-lg font-bold text-teal-800">
          MenuHub
          <span className="mt-0.5 block text-xs font-medium text-zinc-400">لوحة الإدارة</span>
        </Link>
        <div className="flex-1 overflow-y-auto px-3">
          <AdminNav pathname={pathname} />
        </div>
        {footer}
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="فتح القائمة">
            <MenuIcon />
          </Button>
          <Link href="/admin" className="font-semibold text-teal-800">
            MenuHub
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
      <Drawer open={open} onOpenChange={setOpen} title="القائمة" side="start">
        <AdminNav pathname={pathname} onNavigate={() => setOpen(false)} />
        <div className="mt-4">{footer}</div>
      </Drawer>
    </div>
  );
}
