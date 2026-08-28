"use client";

import { cn } from "@/components/lib/cn";
import type { ProductWithImages } from "@/components/lib/types";
import { ProductActions } from "@/components/products/product-actions";
import { ProductAvailabilityToggle } from "@/components/products/product-availability-toggle";
import { ProductPrice } from "@/components/products/product-price";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { ProductVisibilityToggle } from "@/components/products/product-visibility-toggle";
import { Card } from "@/components/ui/card";
import { ImageIcon, StarIcon } from "@/components/ui/icons";
import type { ProductImage } from "@/lib/types";

export function getProductPrimaryImage(product: ProductWithImages): ProductImage | undefined {
  const images = product.images ?? [];
  return images.find((image) => image.is_primary) ?? images[0];
}

export function ProductCard({
  product,
  canEdit,
  canDelete,
  canDuplicate,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleAvailability,
  onToggleVisibility,
}: {
  product: ProductWithImages;
  canEdit?: boolean;
  canDelete?: boolean;
  canDuplicate?: boolean;
  onEdit?: (product: ProductWithImages) => void;
  onDelete?: (product: ProductWithImages) => void;
  onDuplicate?: (product: ProductWithImages) => void;
  onToggleAvailability?: (product: ProductWithImages) => void;
  onToggleVisibility?: (product: ProductWithImages) => void;
}) {
  const image = getProductPrimaryImage(product);
  const showToggles = canEdit && (onToggleAvailability || onToggleVisibility);

  return (
    <Card
      className={cn(
        "overflow-hidden",
        product.status === "HIDDEN" && "opacity-60",
        product.status === "UNAVAILABLE" && "border-orange-200 bg-orange-50/50"
      )}
    >
      <div className="relative aspect-[4/3] bg-zinc-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image.image_url} alt={product.name_ar} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-300">
            <ImageIcon className="size-10" />
          </div>
        )}
        {product.is_featured ? (
          <span className="absolute start-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-amber-400 text-white shadow">
            <StarIcon className="size-4 fill-current" />
          </span>
        ) : null}
        <div className="absolute end-2 top-2 rounded-xl bg-white/90 shadow-sm">
          <ProductActions
            canEdit={canEdit}
            canDelete={canDelete}
            canDuplicate={canDuplicate}
            onEdit={onEdit ? () => onEdit(product) : undefined}
            onDelete={onDelete ? () => onDelete(product) : undefined}
            onDuplicate={onDuplicate ? () => onDuplicate(product) : undefined}
          />
        </div>
      </div>
      <div className="grid gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-zinc-900">{product.name_ar}</h3>
            {product.name_en ? (
              <p className="truncate text-sm text-zinc-500" dir="ltr">
                {product.name_en}
              </p>
            ) : null}
          </div>
          <ProductStatusBadge status={product.status} />
        </div>
        <ProductPrice price={product.price} old_price={product.old_price} currency={product.currency} />
        {showToggles ? (
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-3">
            {onToggleAvailability ? (
              <ProductAvailabilityToggle
                status={product.status}
                canEdit={canEdit}
                onChange={() => onToggleAvailability(product)}
              />
            ) : null}
            {onToggleVisibility ? (
              <ProductVisibilityToggle
                status={product.status}
                canEdit={canEdit}
                onChange={() => onToggleVisibility(product)}
              />
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
