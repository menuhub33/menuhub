"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import type { ProductWithImages } from "@/components/lib/types";
import { getProductPrimaryImage } from "@/components/products/product-card";
import { GripIcon, ImageIcon } from "@/components/ui/icons";

export function ProductSortableList({
  products,
  disabled,
  onReorder,
}: {
  products: ProductWithImages[];
  disabled?: boolean;
  onReorder: (ids: string[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  function reorder(fromId: string, toId: string) {
    if (disabled || fromId === toId) return;
    const ids = products.map((product) => product.id);
    if (!ids.includes(fromId) || !ids.includes(toId)) return;
    const next = ids.filter((id) => id !== fromId);
    const insertAt = next.indexOf(toId);
    next.splice(insertAt, 0, fromId);
    onReorder(next);
  }

  return (
    <ul className="grid gap-2">
      {products.map((product) => {
        const image = getProductPrimaryImage(product);
        return (
          <li
            key={product.id}
            draggable={!disabled}
            onDragStart={(event) => {
              setDraggingId(product.id);
              event.dataTransfer.setData("text/plain", product.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setOverId(product.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const fromId = event.dataTransfer.getData("text/plain");
              reorder(fromId, product.id);
              setDraggingId(null);
              setOverId(null);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2",
              !disabled && "cursor-grab active:cursor-grabbing",
              draggingId === product.id && "opacity-40",
              overId === product.id && draggingId !== product.id && "border-teal-600 bg-teal-50/60"
            )}
          >
            <span className="text-zinc-400" aria-hidden>
              <GripIcon />
            </span>
            <div className="size-10 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-300">
                  <ImageIcon className="size-4" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900">{product.name_ar}</p>
              {product.name_en ? (
                <p className="truncate text-xs text-zinc-500" dir="ltr">
                  {product.name_en}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
