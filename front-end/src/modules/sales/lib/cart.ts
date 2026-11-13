import type { CatalogProduct, DiscountType } from "@/modules/sales/types";

/** Money is handled as integer cents so totals never drift (mirrors the API `Money` helper). */
export const toCents = (value: number) => Math.round(value * 100);
export const fromCents = (cents: number) => cents / 100;

export type CartLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note: string;
  /** Stock ceiling when the product tracks stock; null = unlimited. */
  max: number | null;
};

export type CartAction =
  | { type: "add"; product: CatalogProduct }
  | { type: "increase"; productId: string }
  | { type: "decrease"; productId: string }
  | { type: "remove"; productId: string }
  | { type: "note"; productId: string; note: string }
  | { type: "clear" };

export function cartReducer(lines: CartLine[], action: CartAction): CartLine[] {
  switch (action.type) {
    case "add": {
      const { product } = action;
      if (!product.sellable || product.price == null) return lines;
      const existing = lines.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.max != null && existing.quantity >= existing.max) return lines;
        return lines.map((line) =>
          line.productId === product.id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...lines,
        {
          productId: product.id,
          name: product.name_ar,
          unitPrice: product.price,
          quantity: 1,
          note: "",
          max: product.stock_quantity,
        },
      ];
    }
    case "increase":
      return lines.map((line) =>
        line.productId === action.productId && (line.max == null || line.quantity < line.max)
          ? { ...line, quantity: line.quantity + 1 }
          : line
      );
    case "decrease":
      return lines
        .map((line) =>
          line.productId === action.productId ? { ...line, quantity: line.quantity - 1 } : line
        )
        .filter((line) => line.quantity > 0);
    case "remove":
      return lines.filter((line) => line.productId !== action.productId);
    case "note":
      return lines.map((line) =>
        line.productId === action.productId ? { ...line, note: action.note } : line
      );
    case "clear":
      return [];
  }
}

export type CartDiscount = { type: DiscountType; value: number } | null;

export function cartTotals(lines: CartLine[], discount: CartDiscount) {
  const subtotal = lines.reduce((sum, line) => sum + toCents(line.unitPrice) * line.quantity, 0);

  let discountCents = 0;
  if (discount && discount.value > 0) {
    discountCents =
      discount.type === "PERCENT"
        ? Math.round((subtotal * Math.min(discount.value, 100)) / 100)
        : toCents(discount.value);
  }
  discountCents = Math.min(discountCents, subtotal);

  return {
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: fromCents(subtotal),
    discount: fromCents(discountCents),
    total: fromCents(subtotal - discountCents),
  };
}

/** Quick "tendered" suggestions: exact amount, then the next round figures above it. */
export function cashSuggestions(total: number): number[] {
  const steps = [1000, 5000, 10000, 50000, 100000];
  const values = new Set<number>([total]);
  for (const step of steps) {
    const rounded = Math.ceil(total / step) * step;
    if (rounded > total) values.add(rounded);
    if (values.size >= 4) break;
  }
  return [...values].sort((a, b) => a - b).slice(0, 4);
}

/** Parses user input such as "12,5" or "١٢٫٥" into a number (NaN when not numeric). */
export function parseAmount(raw: string): number {
  const normalized = raw
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[٫,]/g, ".")
    .trim();
  return normalized === "" ? Number.NaN : Number(normalized);
}
