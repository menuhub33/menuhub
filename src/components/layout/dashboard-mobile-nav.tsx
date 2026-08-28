"use client";

import Link from "next/link";
import { cn } from "@/components/lib/cn";
import { Drawer } from "@/components/ui/drawer";
import {
  DEFAULT_DASHBOARD_NAV,
  DashboardSidebar,
} from "@/components/layout/dashboard-sidebar";
import type { NavItem } from "@/components/lib/types";
import type { Restaurant } from "@/lib/types";

export function DashboardMobileNav({
  open,
  onOpenChange,
  restaurant,
  items = DEFAULT_DASHBOARD_NAV,
  activeHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant?: Pick<Restaurant, "name" | "logo_url" | "slug">;
  items?: NavItem[];
  activeHref?: string;
}) {
  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} title="القائمة" side="start">
        <DashboardSidebar
          restaurant={restaurant}
          items={items}
          activeHref={activeHref}
          className="flex h-auto w-full border-e-0 lg:flex"
        />
      </Drawer>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-zinc-200 bg-white px-1 py-1 lg:hidden">
        {items.slice(0, 4).map((item) => {
          const active = activeHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-2 py-2 text-center text-[11px] font-medium",
                active ? "bg-teal-50 text-teal-800" : "text-zinc-500"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
