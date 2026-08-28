"use client";

import { useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { ImageIcon, CartIcon, XIcon } from "@/components/ui/icons";
import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import { PRODUCT_STATUS_LABELS } from "@/components/lib/labels";
import type { ProductWithRelations } from "@/components/lib/types";
import { PublicOptionSelector } from "@/components/public-menu/public-option-selector";
import { PublicQtyStepper } from "@/components/public-menu/public-qty-stepper";
import { PublicSheet } from "@/components/public-menu/public-sheet";

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
  onAddToCart?: (quantity: number, extra: number) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [extra, setExtra] = useState(0);
  const [quantity, setQuantity] = useState(Math.max(1, initialQuantity));

  // Reset during render rather than in an effect: an effect would paint the
  // previous product's selection for a frame before correcting it.
  const [shownProductId, setShownProductId] = useState(product?.id ?? null);
  if (product && product.id !== shownProductId) {
    setShownProductId(product.id);
    setActiveIndex(0);
    setExtra(0);
    setQuantity(Math.max(1, initialQuantity));
  }

  const images = useMemo(() => (product ? sortedImages(product) : []), [product]);
  const unavailable = product?.status === "UNAVAILABLE";
  const groups = product?.option_groups ?? [];
  const oldPrice = product?.old_price;
  const showOldPrice = oldPrice != null && product != null && oldPrice > product.price;
  const unit = product ? product.price + extra : 0;
  const total = unit * quantity;
  const activeImage = images[Math.min(activeIndex, Math.max(images.length - 1, 0))];

  function handleOpenChange(next: boolean) {
    if (!next) {
      setActiveIndex(0);
      setExtra(0);
    }
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
            onAddToCart?.(quantity, extra);
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
        <div className="relative overflow-hidden rounded-2xl bg-[var(--mh-text)]/8">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="absolute top-3 start-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/45 text-white"
            aria-label="إغلاق"
          >
            <XIcon className="size-4" />
          </button>
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage.image_url}
              alt={product.name_ar}
              className="max-h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-44 items-center justify-center">
              <ImageIcon className="size-10 opacity-40" />
            </div>
          )}
        </div>

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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.image_url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}

        <div>
          <h2 className="text-lg font-bold">{product.name_ar}</h2>
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
          </div>
        </div>

        {unavailable ? (
          <Alert variant="warning" title={PRODUCT_STATUS_LABELS.UNAVAILABLE}>
            هذا المنتج غير متوفر حالياً ولا يمكن إضافته للسلة.
          </Alert>
        ) : null}

        {groups.length > 0 ? (
          <PublicOptionSelector
            key={product.id}
            groups={groups}
            currency={product.currency}
            disabled={unavailable}
            onChange={(_ids, nextExtra) => setExtra(nextExtra)}
          />
        ) : null}

        <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold">الكمية</span>
            <PublicQtyStepper
              variant="gold"
              value={quantity}
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
    </PublicSheet>
  );
}
