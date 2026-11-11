import { formatPrice } from "@/core/lib/format";
import { cn } from "@/core/lib/cn";
import { discountPercent } from "@/modules/catalog/lib/merchandising";

export function ProductPrice({
  price,
  old_price,
  currency = "SYP",
  className,
}: {
  price: number | null;
  old_price?: number | null;
  currency?: string;
  className?: string;
}) {
  if (price == null) return null;

  const discount = discountPercent(price, old_price);

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className="font-semibold text-zinc-900">{formatPrice(price, currency)}</span>
      {discount != null && old_price != null ? (
        <span className="text-sm text-zinc-400 line-through">{formatPrice(old_price, currency)}</span>
      ) : null}
      {discount != null ? (
        <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-600">
          حسم {discount}%
        </span>
      ) : null}
    </span>
  );
}
