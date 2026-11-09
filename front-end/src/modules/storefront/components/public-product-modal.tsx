"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/core/ui/alert";
import { ContentImage } from "@/core/ui/content-image";
import { ImageIcon, CartIcon, XIcon } from "@/core/ui/icons";
import { cn } from "@/core/lib/cn";
import { formatPrice } from "@/core/lib/format";
import { PRODUCT_STATUS_LABELS } from "@/core/lib/labels";
import type { ProductWithRelations } from "@/modules/catalog/types";
import { PublicProductBadges } from "@/modules/storefront/components/public-product-badges";
import { discountPercent } from "@/modules/catalog/lib/merchandising";
import { isShownUnavailable, stockCap } from "@/modules/catalog/lib/stock";
import { PublicQtyStepper } from "@/modules/storefront/components/public-qty-stepper";
import { PublicSheet } from "@/modules/storefront/components/public-sheet";

function openingQuantity(product: ProductWithRelations | null, initialQuantity: number) {
  const cap = product ? stockCap(product) : undefined;
  const start = Math.max(1, initialQuantity);
  if (cap == null) return start;
  return Math.min(start, Math.max(cap, 1));
}

function sortedImages(product: ProductWithRelations) {
  return [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

export function PublicProductModal({
  product,
  open,
  onOpenChange,
  initialQuantity = 1,
  onAddToCart,
}: {
  product: ProductWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuantity?: number;
  onAddToCart?: (quantity: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [quantity, setQuantity] = useState(Math.max(1, initialQuantity));

  // Reset during render rather than in an effect: an effect would paint the
  // previous product's selection for a frame before correcting it.
  const [shownProductId, setShownProductId] = useState(product?.id ?? null);
  if (product && product.id !== shownProductId) {
    setShownProductId(product.id);
    setActiveIndex(0);
    setQuantity(openingQuantity(product, initialQuantity));
  }

  const images = useMemo(() => (product ? sortedImages(product) : []), [product]);
  const unavailable = product ? isShownUnavailable(product) : false;
  const cap = product ? stockCap(product) : undefined;
  const oldPrice = product?.old_price;
  const showOldPrice = oldPrice != null && product != null && oldPrice > product.price;
  const total = product ? product.price * quantity : 0;
  const activeImage = images[Math.min(activeIndex, Math.max(images.length - 1, 0))];

  function handleOpenChange(next: boolean) {
    if (!next) setActiveIndex(0);
    onOpenChange(next);
  }

  if (!product) return null;

  return (
    <PublicSheet
      open={open}
      onOpenChange={handleOpenChange}
      hideHeader
      size="lg"
      footer={
        <button
          type="button"
          disabled={unavailable || quantity < 1 || !onAddToCart}
          onClick={() => {
            onAddToCart?.(quantity);
            handleOpenChange(false);
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--mh-primary)] text-sm font-bold text-white disabled:opacity-50"
        >
          <CartIcon className="size-5" />
          أضف للسلة
        </button>
      }
    >
      <div className="grid gap-4">
        <div className="relative flex h-56 items-center justify-center overflow-hidden rounded-2xl bg-[var(--mh-text)]/6">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute top-3 start-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/45 text-white"
            aria-label="إغلاق"
          >
            <XIcon className="size-4" />
          </button>
          <PublicProductBadges product={product} className="absolute bottom-3 start-3 z-10" />
          {activeImage ? (
            <ContentImage
              src={activeImage.image_url}
              alt={product.name_ar}
              sizes="(max-width: 768px) 92vw, 480px"
              priority
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImageIcon className="size-10 opacity-40" />
          )}
        </div>

        <div className="grid gap-4">
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "size-16 shrink-0 overflow-hidden rounded-xl border-2",
                    index === activeIndex
                      ? "border-[var(--mh-primary)]"
                      : "border-transparent opacity-80"
                  )}
                  aria-label={`صورة ${index + 1}`}
                >
                  <ContentImage
                    src={image.image_url}
                    alt=""
                    sizes="64px"
                    className="size-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div>
            <h2 className="text-xl font-bold">{product.name_ar}</h2>
          {product.description_ar ? (
            <p className="mt-1 text-sm leading-relaxed text-zinc-500">{product.description_ar}</p>
          ) : null}
          {product.description_en ? (
            <p className="mt-1 text-sm leading-relaxed text-zinc-400" dir="ltr">
              {product.description_en}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-[var(--mh-primary)]">
              {formatPrice(product.price, product.currency)}
            </span>
            {showOldPrice && oldPrice != null ? (
              <span className="text-sm line-through opacity-50">
                {formatPrice(oldPrice, product.currency)}
              </span>
            ) : null}
            {discountPercent(product.price, oldPrice) != null ? (
              <span className="rounded-md bg-rose-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                حسم {discountPercent(product.price, oldPrice)}%
              </span>
            ) : null}
          </div>
        </div>

        {unavailable ? (
          <Alert variant="warning" title={PRODUCT_STATUS_LABELS.UNAVAILABLE}>
            هذا المنتج غير متوفر حالياً ولا يمكن إضافته للسلة.
          </Alert>
        ) : null}

        <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold">الكمية</span>
            <PublicQtyStepper
              variant="gold"
              value={quantity}
              max={cap}
              onChange={setQuantity}
              disabled={unavailable}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold">المجموع</span>
            <span className="text-base font-bold text-[var(--mh-primary)]">
              {formatPrice(total, product.currency)}
            </span>
          </div>
        </div>
      </div>
      </div>
    </PublicSheet>
  );
}
