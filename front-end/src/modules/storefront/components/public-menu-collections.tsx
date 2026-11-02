"use client";

import { cn } from "@/core/lib/cn";
import { PRODUCT_SEASON_LABELS } from "@/modules/catalog/lib/merchandising";
import type { ProductSeason } from "@/modules/catalog/types";

export type MenuCollection = "featured" | "discount" | "season";

export function PublicMenuCollections({
  active,
  onSelect,
  showFeatured,
  showDiscount,
  showSeason,
  seasons,
  activeSeason,
  onSeason,
}: {
  active: MenuCollection | null;
  onSelect: (collection: MenuCollection) => void;
  showFeatured: boolean;
  showDiscount: boolean;
  showSeason: boolean;
  seasons: ProductSeason[];
  activeSeason: ProductSeason | null;
  onSeason: (season: ProductSeason) => void;
}) {
  if (!showFeatured && !showDiscount && !showSeason) return null;

  const buttons: { id: MenuCollection; label: string; show: boolean }[] = [
    { id: "featured", label: "مميز", show: showFeatured },
    { id: "discount", label: "حسومات", show: showDiscount },
    { id: "season", label: "موسمي", show: showSeason },
  ];

  return (
    <div className="mt-4 grid gap-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="مجموعات الأصناف">
        {buttons.filter((button) => button.show).map((button) => {
          const selected = active === button.id;
          return (
            <button
              key={button.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(button.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold shadow-[0_6px_16px_rgba(0,0,0,0.06)]",
                selected
                  ? "bg-[var(--mh-primary)] text-white"
                  : "bg-white text-[var(--mh-text)] ring-1 ring-black/8"
              )}
            >
              {button.label}
            </button>
          );
        })}
      </div>
      {active === "season" && seasons.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="المواسم">
          {seasons.map((season) => (
            <button
              key={season}
              type="button"
              aria-pressed={season === activeSeason}
              onClick={() => onSeason(season)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                season === activeSeason
                  ? "bg-[var(--mh-secondary)] text-white"
                  : "bg-white text-[var(--mh-text)] ring-1 ring-black/8"
              )}
            >
              {PRODUCT_SEASON_LABELS[season]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
