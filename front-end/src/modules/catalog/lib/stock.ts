import type { ProductStatus } from "@/modules/catalog/types";

type StockProduct = {
  status: ProductStatus;
  stock_quantity?: number | null;
};

/** Empty stock means the product is not tracked. Zero means it is sold out. */
export function stockCap(product: { stock_quantity?: number | null }): number | undefined {
  if (product.stock_quantity == null) return undefined;
  return Math.max(0, product.stock_quantity);
}

export function isShownUnavailable(product: StockProduct): boolean {
  if (product.status === "UNAVAILABLE") return true;
  const cap = stockCap(product);
  return cap != null && cap <= 0;
}

export function stockLabel(product: { stock_quantity?: number | null }): string | null {
  const cap = stockCap(product);
  if (cap == null) return null;
  if (cap <= 0) return "نفد المخزون";
  return `المتبقي: ${cap}`;
}
