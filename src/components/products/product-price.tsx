import { formatPrice } from "@/components/lib/format";
import { cn } from "@/components/lib/cn";

export function ProductPrice({
  price,
  old_price,
  currency = "SYP",
  className,
}: {
  price: number;
  old_price?: number | null;
  currency?: string;
  className?: string;
}) {
  const showDiscount = old_price != null && old_price > price;

  return (
    <span className={cn("inline-flex items-baseline gap-2", className)}>
      <span className="font-semibold text-zinc-900">{formatPrice(price, currency)}</span>
      {showDiscount ? (
        <span className="text-sm text-zinc-400 line-through">{formatPrice(old_price, currency)}</span>
      ) : null}
    </span>
  );
}
