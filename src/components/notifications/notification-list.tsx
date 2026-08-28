"use client";

import { NotificationItem } from "@/components/notifications/notification-item";
import { EmptyState } from "@/components/common/empty-state";
import type { Notification } from "@/lib/types";

export function NotificationList({
  notifications,
  onRead,
}: {
  notifications: Notification[];
  onRead?: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return <EmptyState title="لا توجد إشعارات" description="ستظهر التنبيهات هنا عند حدوث نشاط جديد." />;
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {notifications.map((notification) => (
        <li key={notification.id}>
          <NotificationItem notification={notification} onRead={onRead} />
        </li>
      ))}
    </ul>
  );
}
