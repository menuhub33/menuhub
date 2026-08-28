"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { logout } from "@/actions/auth/logout";
import { markAllNotificationsRead } from "@/actions/notifications/markAllNotificationsRead";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { DashboardMobileNav } from "@/components/layout/dashboard-mobile-nav";
import {
  DEFAULT_DASHBOARD_NAV,
  DashboardSidebar,
} from "@/components/layout/dashboard-sidebar";
import { RestaurantSwitcher } from "@/components/layout/restaurant-switcher";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { NavItem } from "@/components/lib/types";
import type { Notification, Profile, Restaurant, RestaurantRole } from "@/lib/types";

function filterNav(items: NavItem[], role: RestaurantRole): NavItem[] {
  return items
    .filter((item) => !item.permission || hasPermission(role, item.permission as Permission))
    .map((item) => ({
      ...item,
      children: item.children?.filter(
        (child) => !child.permission || hasPermission(role, child.permission as Permission)
      ),
    }));
}

export function DashboardShell({
  restaurant,
  restaurants,
  profile,
  role,
  notifications,
  children,
}: {
  restaurant: Restaurant;
  restaurants: Restaurant[];
  profile: Profile;
  role: RestaurantRole;
  notifications: Notification[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const items = useMemo(() => filterNav(DEFAULT_DASHBOARD_NAV, role), [role]);
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="flex min-h-dvh bg-zinc-50">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <DashboardSidebar restaurant={restaurant} items={items} activeHref={pathname} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          profile={profile}
          unreadCount={unreadCount}
          notifications={notifications}
          onOpenNav={() => setNavOpen(true)}
          onProfile={() => router.push("/dashboard/settings")}
          onLogout={async () => {
            await logout();
            router.push("/login");
            router.refresh();
          }}
          onMarkAllRead={async () => {
            await markAllNotificationsRead();
            router.refresh();
          }}
        />
        <div className="flex items-center gap-3 border-b border-zinc-100 bg-white px-4 py-2 lg:hidden">
          <RestaurantSwitcher restaurants={restaurants} currentId={restaurant.id} />
        </div>
        <div className="hidden border-b border-zinc-100 bg-white px-6 py-2 lg:block">
          <RestaurantSwitcher restaurants={restaurants} currentId={restaurant.id} />
        </div>
        <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:pb-8">{children}</main>
      </div>
      <DashboardMobileNav
        open={navOpen}
        onOpenChange={setNavOpen}
        restaurant={restaurant}
        items={items}
        activeHref={pathname}
      />
    </div>
  );
}
