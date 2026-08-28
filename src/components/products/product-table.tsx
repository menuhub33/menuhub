"use client";

import { cn } from "@/components/lib/cn";
import type { ProductWithImages } from "@/components/lib/types";
import { ProductActions } from "@/components/products/product-actions";
import { ProductAvailabilityToggle } from "@/components/products/product-availability-toggle";
import { getProductPrimaryImage, ProductCard } from "@/components/products/product-card";
import { ProductPrice } from "@/components/products/product-price";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { ProductVisibilityToggle } from "@/components/products/product-visibility-toggle";
import { Card } from "@/components/ui/card";
import { ImageIcon, StarIcon } from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Category } from "@/lib/types";

export function ProductTable({
  products,
  categories,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleAvailability,
  onToggleVisibility,
}: {
  products: ProductWithImages[];
  categories?: Category[];
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (product: ProductWithImages) => void;
  onDelete?: (product: ProductWithImages) => void;
  onDuplicate?: (product: ProductWithImages) => void;
  onToggleAvailability?: (product: ProductWithImages) => void;
  onToggleVisibility?: (product: ProductWithImages) => void;
}) {
  const categoryName = (categoryId: string) =>
    categories?.find((category) => category.id === categoryId)?.name_ar;

  return (
    <>
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">الصورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-20">مميز</TableHead>
                <TableHead className="w-16">
                  <span className="sr-only">إجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const image = getProductPrimaryImage(product);
                const category = categoryName(product.category_id);
                return (
                  <TableRow
                    key={product.id}
                    className={cn(
                      product.status === "HIDDEN" && "opacity-60",
                      product.status === "UNAVAILABLE" && "bg-orange-50/60"
                    )}
                  >
                    <TableCell>
                      <div className="size-12 overflow-hidden rounded-xl bg-zinc-100">
                        {image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={image.image_url}
                            alt={product.name_ar}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-zinc-300">
                            <ImageIcon className="size-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-zinc-900">{product.name_ar}</p>
                      {product.name_en ? (
                        <p className="text-xs text-zinc-500" dir="ltr">
                          {product.name_en}
                        </p>
                      ) : null}
                      {category ? <p className="mt-0.5 text-xs text-zinc-400">{category}</p> : null}
                    </TableCell>
                    <TableCell>
                      <ProductPrice
                        price={product.price}
                        old_price={product.old_price}
                        currency={product.currency}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="grid gap-2">
                        <ProductStatusBadge status={product.status} />
                        {canEdit && onToggleAvailability ? (
                          <ProductAvailabilityToggle
                            status={product.status}
                            canEdit={canEdit}
                            onChange={() => onToggleAvailability(product)}
                          />
                        ) : null}
                        {canEdit && onToggleVisibility ? (
                          <ProductVisibilityToggle
                            status={product.status}
                            canEdit={canEdit}
                            onChange={() => onToggleVisibility(product)}
                          />
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StarIcon
                        className={cn(
                          "size-5",
                          product.is_featured ? "fill-amber-400 text-amber-400" : "text-zinc-300"
                        )}
                        aria-label={product.is_featured ? "منتج مميز" : "غير مميز"}
                      />
                    </TableCell>
                    <TableCell>
                      <ProductActions
                        canEdit={canEdit}
                        canDelete={canDelete}
                        canDuplicate={canEdit}
                        onEdit={onEdit ? () => onEdit(product) : undefined}
                        onDelete={onDelete ? () => onDelete(product) : undefined}
                        onDuplicate={onDuplicate ? () => onDuplicate(product) : undefined}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
      <div className="grid gap-3 md:hidden">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            canEdit={canEdit}
            canDelete={canDelete}
            canDuplicate={canEdit}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onToggleAvailability={onToggleAvailability}
            onToggleVisibility={onToggleVisibility}
          />
        ))}
      </div>
    </>
  );
}
