import { cn } from "@/core/lib/cn";
import { discountPercent } from "@/modules/catalog/lib/merchandising";
import type { Product } from "@/modules/catalog/types";

export function PublicProductBadges({
  product,
  className,
}: {
  product: Pick<Product, "price" | "old_price" | "is_featured">;
  className?: string;
}) {
  const discount = discountPercent(product.price, product.old_price);
  if (discount == null && !product.is_featured) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {discount != null ? (
        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
          حسم {discount}%
        </span>
      ) : null}
      {product.is_featured ? (
        <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-white">
          مميز
        </span>
      ) : null}
    </div>
  );
}
