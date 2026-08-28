"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/components/lib/cn";
import type { CategoryWithProducts } from "@/components/lib/types";
import { productPrimaryImageUrl } from "@/components/public-menu/product-image";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from "@/components/ui/icons";

export const ALL_CATEGORIES_ID = "all";

function categoryCardImage(category: CategoryWithProducts): string | null {
  if (category.image_url) return category.image_url;
  for (const product of category.products ?? []) {
    const url = productPrimaryImageUrl(product);
    if (url) return url;
  }
  return null;
}

export function PublicMenuNavigation({
  categories,
  selectedId,
  onSelect,
  className,
}: {
  categories: CategoryWithProducts[];
  selectedId: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const dragRef = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(":scope > li")];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }

    const overflow = root.scrollWidth - root.clientWidth > 8;
    if (!overflow) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const firstRect = first.getBoundingClientRect();
    const lastRect = last.getBoundingClientRect();
    const slop = 8;

    setCanPrev(firstRect.right > rootRect.right + slop || firstRect.left < rootRect.left - slop);
    setCanNext(lastRect.left < rootRect.left - slop || lastRect.right > rootRect.right + slop);
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    updateArrows();
    root.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(root);
    window.addEventListener("resize", updateArrows);

    return () => {
      root.removeEventListener("scroll", updateArrows);
      observer.disconnect();
      window.removeEventListener("resize", updateArrows);
    };
  }, [categories.length, updateArrows]);

  useEffect(() => {
    const selected = scrollerRef.current?.querySelector<HTMLElement>('[data-selected="true"]');
    selected?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedId]);

  function scrollByCard(direction: -1 | 1) {
    const root = scrollerRef.current;
    if (!root) return;
    const items = [...root.querySelectorAll<HTMLElement>(":scope > li")];
    if (items.length === 0) return;

    const rtl = getComputedStyle(root).direction === "rtl";
    const start = rtl ? root.getBoundingClientRect().right : root.getBoundingClientRect().left;

    let active = 0;
    let best = Number.POSITIVE_INFINITY;
    items.forEach((item, index) => {
      const edge = rtl ? item.getBoundingClientRect().right : item.getBoundingClientRect().left;
      const dist = Math.abs(edge - start);
      if (dist < best) {
        best = dist;
        active = index;
      }
    });

    const target = items[Math.max(0, Math.min(items.length - 1, active + direction))];
    target?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }

  function select(id: string) {
    if (dragRef.current?.moved) return;
    onSelect(id);
  }

  if (categories.length === 0) return null;

  const showArrows = canPrev || canNext;

  return (
    <nav id="menu-categories" className={cn("flex scroll-mt-4 items-center gap-2", className)} aria-label="أقسام المنيو">
      <button
        type="button"
        onClick={() => scrollByCard(-1)}
        disabled={!canPrev}
        aria-label="القسم السابق"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--mh-primary)] shadow-[0_6px_18px_rgba(0,0,0,0.14)] disabled:opacity-30",
          !showArrows && "invisible"
        )}
      >
        <ChevronRightIcon className="size-4" />
      </button>

      <ul
        ref={scrollerRef}
        dir="rtl"
        className="flex min-w-0 flex-1 cursor-grab touch-pan-x flex-nowrap gap-3 overflow-x-auto overscroll-x-contain pb-1 active:cursor-grabbing [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]"
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse") return;
          const root = scrollerRef.current;
          if (!root) return;
          dragRef.current = { x: event.clientX, scroll: root.scrollLeft, moved: false };
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          const root = scrollerRef.current;
          if (!drag || !root) return;
          const dx = event.clientX - drag.x;
          if (Math.abs(dx) > 8) drag.moved = true;
          root.scrollLeft = drag.scroll - dx;
        }}
        onPointerUp={() => {
          requestAnimationFrame(() => {
            dragRef.current = null;
          });
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
      >
        <li className="shrink-0">
          <button
            type="button"
            data-selected={selectedId === ALL_CATEGORIES_ID ? "true" : undefined}
            onClick={() => select(ALL_CATEGORIES_ID)}
            aria-pressed={selectedId === ALL_CATEGORIES_ID}
            className={cn(
              "relative flex size-[6.75rem] items-center justify-center overflow-hidden rounded-2xl bg-[var(--mh-primary)] p-2 text-white shadow-[0_10px_24px_rgba(0,0,0,0.1)]",
              selectedId === ALL_CATEGORIES_ID && "ring-2 ring-[var(--mh-primary)] ring-offset-2"
            )}
          >
            <span className="text-center text-sm font-bold">الكل</span>
          </button>
        </li>
        {categories.map((category) => {
          const imageUrl = categoryCardImage(category);
          const selected = selectedId === category.id;
          return (
            <li key={category.id} className="shrink-0">
              <button
                type="button"
                data-selected={selected ? "true" : undefined}
                onClick={() => select(category.id)}
                aria-pressed={selected}
                className={cn(
                  "relative flex size-[6.75rem] items-center justify-center overflow-hidden rounded-2xl p-0 shadow-[0_10px_24px_rgba(0,0,0,0.08)]",
                  selected && "ring-2 ring-[var(--mh-primary)] ring-offset-2"
                )}
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                  />
                ) : (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--mh-primary)]/20">
                    <ImageIcon className="size-8 opacity-50" />
                  </span>
                )}
                <span className="pointer-events-none absolute inset-0 bg-black/10" />
                <span className="pointer-events-none relative z-10 line-clamp-2 px-2 text-center text-[12px] font-bold leading-tight text-white drop-shadow">
                  {category.name_ar}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => scrollByCard(1)}
        disabled={!canNext}
        aria-label="القسم التالي"
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[var(--mh-primary)] shadow-[0_6px_18px_rgba(0,0,0,0.14)] disabled:opacity-30",
          !showArrows && "invisible"
        )}
      >
        <ChevronLeftIcon className="size-4" />
      </button>
    </nav>
  );
}
