export function discountPercent(price: number | null | undefined, oldPrice: number | null | undefined): number | null {
  if (price == null || !Number.isFinite(price) || oldPrice == null || !Number.isFinite(oldPrice)) return null;
  if (oldPrice <= price || oldPrice <= 0) return null;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function hasDiscount(product: { price: number | null; old_price?: number | null }): boolean {
  return discountPercent(product.price, product.old_price) != null;
}
