"use client";

import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmAction } from "@/components/common/confirm-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Menu, Restaurant } from "@/lib/types";

export function MenuStatusCard({
  restaurant,
  menu,
  canPublish,
  onPublish,
  onUnpublish,
}: {
  restaurant: Pick<Restaurant, "menu_status">;
  menu?: Pick<Menu, "status" | "published_at" | "name"> | null;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
}) {
  const status = menu?.status ?? restaurant.menu_status;
  const published = status === "PUBLISHED";

  return (
    <Card>
      <CardHeader>
        <CardTitle>حالة المنيو</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-zinc-500">{menu?.name ?? "المنيو الافتراضي"}</span>
          <StatusBadge kind="menu" value={status} />
        </div>
        {canPublish ? (
          published ? (
            <ConfirmAction
              title="إلغاء نشر المنيو؟"
              description="سيختفي المنيو عن الزبائن حتى تعيد نشره."
              confirmLabel="إلغاء النشر"
              onConfirm={() => onUnpublish?.()}
            >
              {(open) => (
                <Button variant="outline" onClick={open}>
                  إلغاء النشر
                </Button>
              )}
            </ConfirmAction>
          ) : (
            <Button onClick={onPublish}>نشر المنيو</Button>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
