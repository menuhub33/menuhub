"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/components/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import {
  ChartIcon,
  ChevronDownIcon,
  CreditCardIcon,
  HomeIcon,
  LayoutIcon,
  PaletteIcon,
  QrIcon,
  SettingsIcon,
  UsersIcon,
  UtensilsIcon,
  BuildingIcon,
} from "@/components/ui/icons";
import type { NavItem } from "@/components/lib/types";
import type { Restaurant } from "@/lib/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  menu: UtensilsIcon,
  layout: LayoutIcon,
  theme: PaletteIcon,
  qr: QrIcon,
  analytics: ChartIcon,
  staff: UsersIcon,
  billing: CreditCardIcon,
  restaurant: BuildingIcon,
  settings: SettingsIcon,
};

export const DEFAULT_DASHBOARD_NAV: NavItem[] = [
  { href: "/dashboard", label: "الرئيسية", icon: "home" },
  {
    href: "/dashboard/menu",
    label: "المنيو",
    icon: "menu",
    children: [
      { href: "/dashboard/menu/categories", label: "الأقسام" },
      { href: "/dashboard/menu/products", label: "المنتجات" },
      { href: "/dashboard/menu/options", label: "الإضافات" },
    ],
  },
  { href: "/dashboard/design", label: "التصميم", icon: "theme", permission: "design.update" },
  { href: "/dashboard/qr", label: "QR Code", icon: "qr", permission: "qr.manage" },
  { href: "/dashboard/analytics", label: "الإحصائيات", icon: "analytics", permission: "analytics.view" },
  { href: "/dashboard/restaurant", label: "النشاط", icon: "restaurant", permission: "restaurant.update" },
  { href: "/dashboard/staff", label: "الموظفون", icon: "staff", permission: "staff.manage" },
  { href: "/dashboard/subscription", label: "الاشتراك", icon: "billing", permission: "subscription.manage" },
  { href: "/dashboard/settings", label: "الإعدادات", icon: "settings" },
];

function isActive(href: string, activeHref?: string) {
  if (!activeHref) return false;
  if (href === "/dashboard") return activeHref === "/dashboard";
  return activeHref === href || activeHref.startsWith(`${href}/`);
}

export function DashboardSidebar({
  restaurant,
  items = DEFAULT_DASHBOARD_NAV,
  activeHref,
  className,
}: {
  restaurant?: Pick<Restaurant, "name" | "logo_url" | "slug">;
  items?: NavItem[];
  activeHref?: string;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-e border-zinc-200 bg-white max-lg:w-full",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4">
        <Avatar src={restaurant?.logo_url} alt={restaurant?.name ?? "MenuHub"} fallback="MH" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {restaurant?.name ?? "MenuHub"}
          </p>
          {restaurant?.slug ? (
            <p className="truncate text-xs text-zinc-500" dir="ltr">
              {restaurant.slug}
            </p>
          ) : null}
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} item={item} activeHref={activeHref} />
        ))}
      </nav>
    </aside>
  );
}

function NavLink({ item, activeHref }: { item: NavItem; activeHref?: string }) {
  const Icon = item.icon ? ICONS[item.icon] : undefined;
  const active = isActive(item.href, activeHref);
  const [open, setOpen] = useState(active);
  const childActive = item.children?.some((child) => isActive(child.href, activeHref));

  if (item.children?.length) {
    return (
      <div>
        <div className="flex items-center">
          <Link
            href={item.href}
            className={cn(
              "flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active || childActive
                ? "bg-teal-50 text-teal-800"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            )}
          >
            {Icon ? <Icon className="size-5" /> : null}
            <span className="flex-1">{item.label}</span>
          </Link>
          <button
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-50"
            onClick={() => setOpen((current) => !current)}
            aria-label="فتح القائمة الفرعية"
          >
            <ChevronDownIcon className={cn("size-4", open && "rotate-180")} />
          </button>
        </div>
        {open ? (
          <div className="ms-6 mt-1 space-y-1 border-s border-zinc-100 ps-3">
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "block rounded-lg px-2 py-2 text-sm",
                  isActive(child.href, activeHref)
                    ? "bg-teal-50 font-medium text-teal-800"
                    : "text-zinc-500 hover:text-zinc-800"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active ? "bg-teal-50 text-teal-800" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      )}
    >
      {Icon ? <Icon className="size-5" /> : null}
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}
