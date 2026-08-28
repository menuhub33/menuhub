"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import { ProductImageUpload } from "@/components/products/product-image-upload";
import { Button } from "@/components/ui/button";
import { GripIcon, StarIcon, TrashIcon } from "@/components/ui/icons";
import type { ProductImage } from "@/lib/types";

export type ProductGalleryItem = Pick<ProductImage, "id" | "image_url" | "sort_order" | "is_primary">;

function sortImages(images: ProductGalleryItem[]): ProductGalleryItem[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order);
}

function withSortOrder(images: ProductGalleryItem[]): ProductGalleryItem[] {
  return images.map((image, index) => ({ ...image, sort_order: index }));
}

export function ProductGallery({
  images,
  disabled,
  onChange,
  onSetPrimary,
  onRemove,
  onReorder,
  onAdd,
  onUpload,
}: {
  images: ProductGalleryItem[];
  disabled?: boolean;
  onChange?: (images: ProductGalleryItem[]) => void;
  onSetPrimary?: (id: string) => void;
  onRemove?: (id: string) => void;
  onReorder?: (ids: string[]) => void;
  onAdd?: (image: ProductGalleryItem) => void;
  onUpload?: (file: File) => Promise<string>;
}) {
  const ordered = sortImages(images);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  function emit(next: ProductGalleryItem[]) {
    const normalized = withSortOrder(next);
    onChange?.(normalized);
  }

  function setPrimary(id: string) {
    if (disabled) return;
    onSetPrimary?.(id);
    emit(ordered.map((image) => ({ ...image, is_primary: image.id === id })));
  }

  function remove(id: string) {
    if (disabled) return;
    onRemove?.(id);
    const remaining = ordered.filter((image) => image.id !== id);
    const first = remaining[0];
    if (first && !remaining.some((image) => image.is_primary)) {
      remaining[0] = { ...first, is_primary: true };
    }
    emit(remaining);
  }

  function reorder(fromId: string, toId: string) {
    if (disabled || fromId === toId) return;
    const moved = ordered.find((image) => image.id === fromId);
    if (!moved) return;
    const without = ordered.filter((image) => image.id !== fromId);
    const insertAt = without.findIndex((image) => image.id === toId);
    if (insertAt < 0) return;
    without.splice(insertAt, 0, moved);
    onReorder?.(without.map((image) => image.id));
    emit(without);
  }

  async function addFromUrl(url: string) {
    const item: ProductGalleryItem = {
      id: crypto.randomUUID(),
      image_url: url,
      sort_order: ordered.length,
      is_primary: ordered.length === 0,
    };
    onAdd?.(item);
    emit([...ordered, item]);
  }

  return (
    <div className="grid gap-3">
      {ordered.length === 0 ? (
        <p className="text-sm text-zinc-500">لم تُضف صور بعد. ارفع الصورة الرئيسية للمنتج.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {ordered.map((image) => (
            <li
              key={image.id}
              draggable={!disabled}
              onDragStart={(event) => {
                setDraggingId(image.id);
                event.dataTransfer.setData("text/plain", image.id);
                event.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData("text/plain");
                reorder(fromId, image.id);
                setDraggingId(null);
              }}
              onDragEnd={() => setDraggingId(null)}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50",
                draggingId === image.id && "opacity-50",
                image.is_primary && "ring-2 ring-teal-700"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.image_url} alt="" className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-zinc-950/55 p-1.5">
                <span
                  className="inline-flex cursor-grab rounded-lg p-1 text-white active:cursor-grabbing"
                  aria-hidden
                >
                  <GripIcon className="size-4" />
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "size-8 text-white hover:bg-white/15",
                      image.is_primary && "text-amber-300"
                    )}
                    disabled={disabled}
                    aria-label={image.is_primary ? "الصورة الرئيسية" : "تعيين كصورة رئيسية"}
                    onClick={() => setPrimary(image.id)}
                  >
                    <StarIcon className={cn("size-4", image.is_primary && "fill-current")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-white hover:bg-red-500/80"
                    disabled={disabled}
                    aria-label="حذف الصورة"
                    onClick={() => remove(image.id)}
                  >
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </div>
              {image.is_primary ? (
                <span className="absolute start-2 top-2 rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-medium text-white">
                  رئيسية
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {disabled ? null : (
        <ProductImageUpload
          key={uploadKey}
          label={ordered.length === 0 ? "الصورة الرئيسية" : "إضافة صورة"}
          onUpload={onUpload}
          onUploaded={(url) => {
            if (!url) return;
            if (onUpload && url.startsWith("blob:")) return;
            void addFromUrl(url).then(() => setUploadKey((current) => current + 1));
          }}
        />
      )}
    </div>
  );
}
