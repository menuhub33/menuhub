"use client";

import { useState } from "react";
import { ConfirmAction } from "@/components/common/confirm-action";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";
import type { ProductOption } from "@/lib/types";

function reorderIds(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids;
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (!moved) return ids;
  next.splice(to, 0, moved);
  return next;
}

function deltaLabel(delta: number, currency: string): string {
  if (delta === 0) return "بدون إضافة";
  const formatted = formatPrice(Math.abs(delta), currency);
  return delta > 0 ? `+${formatted}` : `−${formatted}`;
}

export function OptionList({
  options,
  currency = "SYP",
  sortable,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onReorder,
}: {
  options: ProductOption[];
  currency?: string;
  sortable?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (option: ProductOption) => void;
  onDelete?: (option: ProductOption) => void;
  onReorder?: (ids: string[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const canSort = Boolean(sortable && canEdit && onReorder);

  if (options.length === 0) {
    return (
      <EmptyState
        className="min-h-28 py-6"
        title="لا توجد خيارات"
        description="أضف خيارات مثل الحجم أو الإضافات."
      />
    );
  }

  function handleDrop(targetId: string) {
    if (!draggingId || !onReorder) return;
    onReorder(
      reorderIds(
        options.map((option) => option.id),
        draggingId,
        targetId
      )
    );
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <ul className="grid gap-2">
      {options.map((option) => (
        <li
          key={option.id}
          onDragOver={(event) => {
            if (!canSort) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOverId(option.id);
          }}
          onDrop={(event) => {
            if (!canSort) return;
            event.preventDefault();
            handleDrop(option.id);
          }}
          onDragLeave={() => {
            if (overId === option.id) setOverId(null);
          }}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-2.5 py-2",
            draggingId === option.id && "opacity-50",
            overId === option.id && draggingId !== option.id && "border-teal-600 ring-2 ring-teal-700/20"
          )}
        >
          {canSort ? (
            <span
              draggable
              role="button"
              tabIndex={0}
              aria-label={`إعادة ترتيب ${option.name_ar}`}
              className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", option.id);
                setDraggingId(option.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setOverId(null);
              }}
            >
              <GripIcon className="size-4" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{option.name_ar}</p>
            {option.name_en ? (
              <p className="truncate text-xs text-zinc-400">{option.name_en}</p>
            ) : null}
          </div>
          <span className="shrink-0 text-sm font-medium text-teal-800">
            {deltaLabel(option.price_delta, currency)}
          </span>
          <Badge variant={option.is_active ? "success" : "outline"}>
            {option.is_active ? "نشط" : "مخفي"}
          </Badge>
          {canEdit && onEdit ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`تعديل ${option.name_ar}`}
              onClick={() => onEdit(option)}
            >
              <PencilIcon className="size-4" />
            </Button>
          ) : null}
          {canDelete && onDelete ? (
            <ConfirmAction
              title="حذف الخيار؟"
              description={`سيتم حذف «${option.name_ar}» من المجموعة.`}
              confirmLabel="حذف الخيار"
              onConfirm={() => onDelete(option)}
            >
              {(open) => (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`حذف ${option.name_ar}`}
                  onClick={open}
                >
                  <TrashIcon className="size-4 text-red-600" />
                </Button>
              )}
            </ConfirmAction>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
