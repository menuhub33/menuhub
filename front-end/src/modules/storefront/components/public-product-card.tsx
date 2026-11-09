import { cn } from "@/core/lib/cn";
import { currencySymbol, formatAmount } from "@/core/lib/format";
import type { ProductWithRelations } from "@/modules/catalog/types";
import { productPrimaryImageUrl } from "@/modules/storefront/components/product-image";
import { PublicProductBadges } from "@/modules/storefront/components/public-product-badges";
import { PublicQtyStepper } from "@/modules/storefront/components/public-qty-stepper";
import { isShownUnavailable, stockCap, stockLabel } from "@/modules/catalog/lib/stock";
import { ContentImage } from "@/core/ui/content-image";
import { ImageIcon } from "@/core/ui/icons";

export function PublicProductCard({
  product,
  onClick,
  quantity = 0,
  onQuantityChange,
  showStockCount = true,
  className,
}: {
  product: ProductWithRelations;
  onClick?: () => void;
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  showStockCount?: boolean;
  className?: string;
}) {
  const unavailable = isShownUnavailable(product);
  const cap = stockCap(product);
  const remaining = showStockCount ? stockLabel(product) : null;
  const imageUrl = productPrimaryImageUrl(product);
  const price = product.price;
  const oldPrice = product.old_price;
  const priced = price != null;
  const showOldPrice = price != null && oldPrice != null && oldPrice > price;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/4",
        unavailable && "opacity-60",
        className
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className="block w-full text-start disabled:cursor-default"
        aria-label={product.name_ar}
      >
        <div className="relative aspect-square overflow-hidden bg-white">
          {imageUrl ? (
            <ContentImage
              src={imageUrl}
              alt=""
              sizes="(max-width: 768px) 46vw, 240px"
              className="size-full object-contain p-3"
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-[var(--mh-text)]/8">
              <ImageIcon className="size-8 opacity-35" />
            </span>
          )}
          <PublicProductBadges product={product} className="absolute top-2.5 start-2.5" />
        </div>
        <h3 className="line-clamp-2 min-h-10 px-3 pt-3 text-start text-sm font-bold leading-snug text-zinc-900">
          {product.name_ar}
        </h3>
      </button>
      <div className="flex items-end justify-between gap-2 px-3 pt-1 pb-3">
        <div className="min-w-0">
          {price != null ? (
            <p className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-sm font-bold text-zinc-900" dir="ltr">
                {currencySymbol(product.currency)}
                {formatAmount(price)}
              </span>
              {showOldPrice && oldPrice != null ? (
                <span className="text-xs text-zinc-400 line-through" dir="ltr">
                  {currencySymbol(product.currency)}
                  {formatAmount(oldPrice)}
                </span>
              ) : null}
            </p>
          ) : null}
          {remaining && !unavailable ? (
            <p className="text-[10px] text-zinc-500">{remaining}</p>
          ) : null}
        </div>
        {onQuantityChange && priced ? (
          <PublicQtyStepper
            value={quantity}
            onChange={onQuantityChange}
            max={cap}
            disabled={unavailable}
          />
        ) : null}
      </div>
    </article>
  );
}
