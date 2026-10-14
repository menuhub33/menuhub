"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { LogOutIcon, MenuIcon } from "@/components/ui/icons";
import { NotificationBell } from "@/components/notifications/notification-bell";
import type { Notification, Profile } from "@/lib/types";

export function DashboardHeader({
  profile,
  unreadCount = 0,
  notifications = [],
  onOpenNav,
  onLogout,
  onProfile,
  onMarkAllRead,
  onOpenNotifications,
}: {
  profile?: Pick<Profile, "full_name" | "avatar_url">;
  unreadCount?: number;
  notifications?: Notification[];
  onOpenNav?: () => void;
  onLogout?: () => void | Promise<void>;
  onProfile?: () => void;
  onMarkAllRead?: () => void;
  onOpenNotifications?: () => void;
}) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (!onLogout || loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-zinc-200 bg-white/90 px-3 backdrop-blur sm:gap-3 sm:px-4">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenNav} aria-label="فتح القائمة">
        <MenuIcon />
      </Button>
      <Link href="/dashboard" className="font-semibold text-teal-800 lg:hidden">
        MenuHub
      </Link>
      <div className="ms-auto flex items-center gap-2">
        <NotificationBell
          unreadCount={unreadCount}
          notifications={notifications}
          onMarkAllRead={onMarkAllRead}
          onOpen={onOpenNotifications}
        />
        <DropdownMenu
          align="end"
          trigger={
            <button type="button" className="flex items-center gap-2 rounded-xl p-1 hover:bg-zinc-50">
              <Avatar src={profile?.avatar_url} alt={profile?.full_name ?? ""} fallback="م" size="sm" />
              <span className="hidden text-sm font-medium text-zinc-800 sm:inline">
                {profile?.full_name ?? "حسابي"}
              </span>
            </button>
          }
          items={[{ id: "profile", label: "الملف الشخصي", onSelect: onProfile }]}
        />
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={handleLogout}
          loading={loggingOut}
          aria-label="تسجيل الخروج"
        >
          <LogOutIcon className="size-4" />
          تسجيل الخروج
        </Button>
      </div>
    </header>
  );
}
