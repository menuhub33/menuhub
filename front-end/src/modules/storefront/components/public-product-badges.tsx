import { cn } from "@/core/lib/cn";
import {
  discountPercent,
  PRODUCT_SEASON_LABELS,
} from "@/modules/catalog/lib/merchandising";
import type { Product } from "@/modules/catalog/types";

export function PublicProductBadges({
  product,
  className,
}: {
  product: Pick<Product, "price" | "old_price" | "is_featured" | "season">;
  className?: string;
}) {
  const discount = discountPercent(product.price, product.old_price);
  const season = product.season ? PRODUCT_SEASON_LABELS[product.season] : null;
  if (discount == null && !product.is_featured && !season) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {discount != null ? (
        <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
          حسم {discount}%
        </span>
      ) : null}
      {product.is_featured ? (
        <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
          مميز
        </span>
      ) : null}
      {season ? (
        <span className="rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-zinc-800 ring-1 ring-black/10">
          {season}
        </span>
      ) : null}
    </div>
  );
}
