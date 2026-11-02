"use client";

import { useState } from "react";
import { cn } from "@/core/lib/cn";
import {
  currentSeason,
  hasDiscount,
  PRODUCT_SEASON_LABELS,
  PRODUCT_SEASONS,
} from "@/modules/catalog/lib/merchandising";
import type { ProductSeason, ProductWithRelations } from "@/modules/catalog/types";
import { PublicProductGrid } from "@/modules/storefront/components/public-product-grid";

export function PublicMenuHighlights({
  products,
  quantities,
  onQuantityChange,
  onProductOpen,
}: {
  products: ProductWithRelations[];
  quantities?: Record<string, number>;
  onQuantityChange?: (productId: string, next: number) => void;
  onProductOpen?: (product: ProductWithRelations) => void;
}) {
  const featured = products.filter((product) => product.is_featured);
  const discounted = products.filter((product) => hasDiscount(product));
  const seasonal = products.filter((product) => product.season);
  const availableSeasons = PRODUCT_SEASONS.filter((season) =>
    seasonal.some((product) => product.season === season)
  );
  const [picked, setPicked] = useState<ProductSeason | null>(null);
  const activeSeason =
    picked && availableSeasons.includes(picked)
      ? picked
      : availableSeasons.includes(currentSeason())
        ? currentSeason()
        : availableSeasons[0];
  const seasonProducts = activeSeason
    ? seasonal.filter((product) => product.season === activeSeason)
    : [];

  if (featured.length === 0 && discounted.length === 0 && seasonal.length === 0) return null;

  return (
    <div className="mt-6 grid gap-6">
      {featured.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">منتجات مميزة</h2>
          <PublicProductGrid
            products={featured}
            quantities={quantities}
            onQuantityChange={onQuantityChange}
            onProductOpen={onProductOpen}
          />
        </section>
      ) : null}
      {discounted.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg font-bold">حسومات</h2>
          <PublicProductGrid
            products={discounted}
            quantities={quantities}
            onQuantityChange={onQuantityChange}
            onProductOpen={onProductOpen}
          />
        </section>
      ) : null}
      {activeSeason ? (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">موسمي</h2>
            <div className="flex flex-wrap gap-1.5">
              {availableSeasons.map((season) => (
                <button
                  key={season}
                  type="button"
                  onClick={() => setPicked(season)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    season === activeSeason
                      ? "bg-[var(--mh-primary)] text-white"
                      : "bg-white text-[var(--mh-text)] ring-1 ring-black/10"
                  )}
                >
                  {PRODUCT_SEASON_LABELS[season]}
                </button>
              ))}
            </div>
          </div>
          <PublicProductGrid
            products={seasonProducts}
            quantities={quantities}
            onQuantityChange={onQuantityChange}
            onProductOpen={onProductOpen}
          />
        </section>
      ) : null}
    </div>
  );
}
