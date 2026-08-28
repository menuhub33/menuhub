"use client";

import { cn } from "@/components/lib/cn";
import { formatRelativeTime } from "@/components/lib/format";
import type { Notification } from "@/lib/types";

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead?: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onRead?.(notification.id)}
      className={cn(
        "flex w-full flex-col gap-1 px-4 py-3 text-start hover:bg-zinc-50",
        !notification.is_read && "bg-teal-50/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-900">{notification.title}</p>
        {!notification.is_read ? <span className="mt-1 size-2 shrink-0 rounded-full bg-teal-600" /> : null}
      </div>
      <p className="text-sm text-zinc-600">{notification.message}</p>
      <p className="text-xs text-zinc-400">{formatRelativeTime(notification.created_at)}</p>
    </button>
  );
}
