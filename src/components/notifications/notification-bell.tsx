"use client";

import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";
import { BellIcon } from "@/components/ui/icons";
import { NotificationList } from "@/components/notifications/notification-list";
import type { Notification } from "@/lib/types";

export function NotificationBell({
  unreadCount = 0,
  notifications = [],
  onMarkAllRead,
  onOpen,
  onRead,
}: {
  unreadCount?: number;
  notifications?: Notification[];
  onMarkAllRead?: () => void;
  onOpen?: () => void;
  onRead?: (id: string) => void;
}) {
  return (
    <Popover
      align="end"
      trigger={
        <button
          type="button"
          onClick={onOpen}
          className="relative rounded-xl p-2 text-zinc-600 hover:bg-zinc-100"
          aria-label="الإشعارات"
        >
          <BellIcon />
          {unreadCount > 0 ? (
            <span className="absolute end-1 top-1 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      }
    >
      <div className="w-[min(22rem,calc(100vw-2rem))]">
        <div className="mb-2 flex items-center justify-between px-1">
          <p className="text-sm font-semibold">الإشعارات</p>
          {onMarkAllRead ? (
            <Button variant="link" size="sm" onClick={onMarkAllRead}>
              تعليم الكل كمقروء
            </Button>
          ) : null}
        </div>
        <div className="max-h-80 overflow-y-auto">
          <NotificationList notifications={notifications.slice(0, 8)} onRead={onRead} />
        </div>
      </div>
    </Popover>
  );
}
