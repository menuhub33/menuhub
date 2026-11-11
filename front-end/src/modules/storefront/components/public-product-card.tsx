import { cn } from "@/core/lib/cn";
import { currencySymbol, formatAmount } from "@/core/lib/format";
import type { ProductWithRelations } from "@/modules/catalog/types";
import { productPrimaryImageUrl } from "@/modules/storefront/components/product-image";
import { PublicProductBadges } from "@/modules/storefront/components/public-product-badges";
import { PublicQtyStepper } from "@/modules/storefront/components/public-qty-stepper";
import { isShownUnavailable, stockCap, stockLabel } from "@/modules/catalog/lib/stock";
import { ContentImage } from "@/core/ui/content-image";
import { ImageIcon } from "@/core/ui/icons";
import { menuImageSizes } from "@/modules/storefront/lib/menu-layout";

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
              sizes={menuImageSizes}
              className="size-full object-contain p-2 sm:p-3"
            />
          ) : (
            <span className="flex size-full items-center justify-center bg-[var(--mh-text)]/8">
              <ImageIcon className="size-8 opacity-35" />
            </span>
          )}
          <PublicProductBadges product={product} className="absolute top-2.5 start-2.5" />
        </div>
        <h3 className="line-clamp-2 min-h-9 px-2.5 pt-2.5 text-start text-[13px] font-bold leading-snug text-zinc-900 sm:min-h-10 sm:px-3 sm:pt-3 sm:text-sm">
          {product.name_ar}
        </h3>
      </button>
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5 px-2.5 pt-1 pb-2.5 sm:px-3 sm:pb-3">
        <div className="min-w-0">
          {price != null ? (
            <p className="flex flex-col items-start gap-0.5">
              <span className="text-[13px] font-bold text-zinc-900 sm:text-sm" dir="ltr">
                {currencySymbol(product.currency)}
                {formatAmount(price)}
              </span>
              {showOldPrice && oldPrice != null ? (
                <span className="text-[11px] text-zinc-400 line-through sm:text-xs" dir="ltr">
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
            className="shrink-0"
          />
        ) : null}
      </div>
    </article>
  );
}
