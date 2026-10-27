"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/ui/card";
import { NotificationList } from "@/modules/notifications/components/notification-list";
import { Button } from "@/core/ui/button";
import type { Notification } from "@/modules/notifications/types";

export function NotificationCenter({
  notifications,
  onRead,
  onMarkAllRead,
}: {
  notifications: Notification[];
  onRead?: (id: string) => void;
  onMarkAllRead?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>مركز الإشعارات</CardTitle>
        {onMarkAllRead ? (
          <Button variant="outline" size="sm" onClick={onMarkAllRead}>
            تعليم الكل كمقروء
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="px-0">
        <NotificationList notifications={notifications} onRead={onRead} />
      </CardContent>
    </Card>
  );
}
