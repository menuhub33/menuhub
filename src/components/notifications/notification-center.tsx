"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationList } from "@/components/notifications/notification-list";
import { Button } from "@/components/ui/button";
import type { Notification } from "@/lib/types";

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
