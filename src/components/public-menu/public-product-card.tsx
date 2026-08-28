import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import { PRODUCT_STATUS_LABELS } from "@/components/lib/labels";
import type { ProductWithRelations } from "@/components/lib/types";
import { productPrimaryImageUrl } from "@/components/public-menu/product-image";
import { PublicQtyStepper } from "@/components/public-menu/public-qty-stepper";
import { ImageIcon } from "@/components/ui/icons";

export function PublicProductCard({
  product,
  onClick,
  quantity = 0,
  onQuantityChange,
  className,
}: {
  product: ProductWithRelations;
  onClick?: () => void;
  quantity?: number;
  onQuantityChange?: (next: number) => void;
  className?: string;
}) {
  const unavailable = product.status === "UNAVAILABLE";
  const imageUrl = productPrimaryImageUrl(product);
  const oldPrice = product.old_price;
  const showOldPrice = oldPrice != null && oldPrice > product.price;

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
        <div className="relative aspect-square overflow-hidden bg-[var(--mh-text)]/8">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center">
              <ImageIcon className="size-8 opacity-35" />
            </span>
          )}
          {unavailable ? (
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--mh-bg)]/60 text-[11px] font-medium">
              {PRODUCT_STATUS_LABELS.UNAVAILABLE}
            </span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 min-h-10 px-2.5 pt-2.5 text-center text-sm font-bold leading-snug">
          {product.name_ar}
        </h3>
      </button>
      <div className="flex items-center justify-between gap-1 px-2.5 pt-1 pb-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[var(--mh-primary)]">
            {formatPrice(product.price, product.currency)}
          </p>
          {showOldPrice ? (
            <p className="text-[10px] line-through opacity-45">
              {formatPrice(oldPrice, product.currency)}
            </p>
          ) : null}
        </div>
        {onQuantityChange ? (
          <PublicQtyStepper
            value={quantity}
            onChange={onQuantityChange}
            disabled={unavailable}
          />
        ) : null}
      </div>
    </article>
  );
}
