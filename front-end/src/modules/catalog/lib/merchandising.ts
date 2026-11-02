import type { ProductSeason } from "@/modules/catalog/types";

export const PRODUCT_SEASONS: ProductSeason[] = ["WINTER", "SPRING", "SUMMER", "AUTUMN"];

export const PRODUCT_SEASON_LABELS: Record<ProductSeason, string> = {
  WINTER: "شتاء",
  SPRING: "ربيع",
  SUMMER: "صيف",
  AUTUMN: "خريف",
};

/** Meteorological season: Dec–Feb winter, Mar–May spring, Jun–Aug summer, Sep–Nov autumn. */
export function currentSeason(date = new Date()): ProductSeason {
  const month = date.getMonth();
  if (month === 11 || month <= 1) return "WINTER";
  if (month <= 4) return "SPRING";
  if (month <= 7) return "SUMMER";
  return "AUTUMN";
}

export function discountPercent(price: number, oldPrice: number | null | undefined): number | null {
  if (!Number.isFinite(price) || oldPrice == null || !Number.isFinite(oldPrice)) return null;
  if (oldPrice <= price || oldPrice <= 0) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function hasDiscount(product: { price: number; old_price?: number | null }): boolean {
  return discountPercent(product.price, product.old_price) != null;
}
