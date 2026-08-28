"use client";

import { ConfirmAction } from "@/components/common/confirm-action";
import { formatDate } from "@/components/lib/format";
import { MenuStatusBadge } from "@/components/menu/menu-status-badge";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "@/components/ui/icons";
import type { Menu } from "@/lib/types";

export function MenuHeader({
  menu,
  canPublish,
  onPublish,
  onUnpublish,
  onPreview,
}: {
  menu: Menu;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onPreview?: () => void;
}) {
  const published = menu.status === "PUBLISHED";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="truncate text-lg font-semibold text-zinc-900">{menu.name}</h1>
          <MenuStatusBadge status={menu.status} />
        </div>
        {menu.description ? (
          <p className="mt-1 text-sm text-zinc-500">{menu.description}</p>
        ) : null}
        {menu.published_at ? (
          <p className="mt-1 text-xs text-zinc-400">نُشر في {formatDate(menu.published_at)}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onPreview ? (
          <Button variant="outline" onClick={onPreview}>
            <EyeIcon className="size-4" />
            معاينة
          </Button>
        ) : null}
        {canPublish ? (
          published ? (
            <ConfirmAction
              title="إلغاء نشر المنيو؟"
              description="سيختفي المنيو عن الزبائن حتى تعيد نشره. المحتوى يبقى محفوظًا."
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
      </div>
    </div>
  );
}
