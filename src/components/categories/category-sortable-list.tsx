"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import { Badge } from "@/components/ui/badge";
import { GripIcon } from "@/components/ui/icons";
import type { Category } from "@/lib/types";

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

export function CategorySortableList({
  categories,
  onReorder,
  disabled,
}: {
  categories: Category[];
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function handleDrop(targetId: string) {
    if (!draggingId) return;
    onReorder(
      reorderIds(
        categories.map((category) => category.id),
        draggingId,
        targetId
      )
    );
    setDraggingId(null);
    setOverId(null);
  }

  if (categories.length === 0) {
    return <p className="px-1 text-sm text-zinc-500">لا توجد أقسام لإعادة ترتيبها.</p>;
  }

  return (
    <ul className="grid gap-2">
      {categories.map((category) => (
        <li
          key={category.id}
          onDragOver={(event) => {
            if (disabled) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOverId(category.id);
          }}
          onDrop={(event) => {
            if (disabled) return;
            event.preventDefault();
            handleDrop(category.id);
          }}
          onDragLeave={() => {
            if (overId === category.id) setOverId(null);
          }}
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3",
            draggingId === category.id && "opacity-50",
            overId === category.id && draggingId !== category.id && "border-teal-600 ring-2 ring-teal-700/20"
          )}
        >
          {disabled ? (
            <span className="text-zinc-300">
              <GripIcon className="size-5" />
            </span>
          ) : (
            <span
              draggable
              role="button"
              tabIndex={0}
              aria-label={`إعادة ترتيب ${category.name_ar}`}
              className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", category.id);
                setDraggingId(category.id);
              }}
              onDragEnd={() => {
                setDraggingId(null);
                setOverId(null);
              }}
            >
              <GripIcon className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900">{category.name_ar}</p>
            {category.name_en ? (
              <p className="truncate text-xs text-zinc-400">{category.name_en}</p>
            ) : null}
          </div>
          <Badge variant={category.is_active ? "success" : "outline"}>
            {category.is_active ? "نشط" : "مخفي"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
