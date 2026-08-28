"use client";

import { useState, type ReactNode } from "react";
import { ConfirmAction } from "@/components/common/confirm-action";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import type { CategoryWithProducts, ProductWithRelations } from "@/components/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GripIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/ui/icons";

function primaryImage(product: ProductWithRelations): string | null {
  const images = product.images ?? [];
  return images.find((image) => image.is_primary)?.image_url ?? images[0]?.image_url ?? null;
}

let productDragActive = false;

export function isProductDragActive(): boolean {
  return productDragActive;
}

function reorderIds(ids: string[], fromId: string, toId: string): string[] {
  if (fromId === toId) return ids;
  const from = ids.indexOf(fromId);
  const to = ids.indexOf(toId);
  if (from < 0 || to < 0) return ids;
  const next = [...ids];
  const [moved] = next.splice(from, 1);
  if (!moved) return ids;
  next.splice(to, 0, moved);
  return next;
}

export function MenuCategoryCard({
  category,
  canEdit,
  canDeleteCategory,
  canDeleteProduct,
  sortableProducts,
  onEditCategory,
  onDeleteCategory,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onReorderProducts,
  dragHandle,
}: {
  category: CategoryWithProducts;
  canEdit?: boolean;
  canDeleteCategory?: boolean;
  canDeleteProduct?: boolean;
  sortableProducts?: boolean;
  onEditCategory?: (category: CategoryWithProducts) => void;
  onDeleteCategory?: (category: CategoryWithProducts) => void;
  onAddProduct?: (category: CategoryWithProducts) => void;
  onEditProduct?: (product: ProductWithRelations, category: CategoryWithProducts) => void;
  onDeleteProduct?: (product: ProductWithRelations, category: CategoryWithProducts) => void;
  onReorderProducts?: (categoryId: string, ids: string[]) => void;
  dragHandle?: ReactNode;
}) {
  const products = category.products ?? [];
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const productSortable = Boolean(sortableProducts && canEdit && onReorderProducts);

  function handleDrop(targetId: string) {
    if (!draggingId || !onReorderProducts) return;
    onReorderProducts(
      category.id,
      reorderIds(
        products.map((product) => product.id),
        draggingId,
        targetId
      )
    );
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {dragHandle}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="truncate">{category.name_ar}</CardTitle>
                {!category.is_active ? <Badge variant="outline">مخفي</Badge> : null}
              </div>
              {category.name_en ? (
                <p className="mt-0.5 truncate text-sm text-zinc-500">{category.name_en}</p>
              ) : null}
              <p className="mt-1 text-xs text-zinc-400">
                {products.length} {products.length === 1 ? "منتج" : "منتجات"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
          {canEdit && onAddProduct ? (
            <Button size="sm" variant="outline" onClick={() => onAddProduct(category)}>
              <PlusIcon className="size-4" />
              منتج
            </Button>
          ) : null}
          {canEdit && onEditCategory ? (
            <Button
              size="icon"
              variant="ghost"
              aria-label="تعديل القسم"
              onClick={() => onEditCategory(category)}
            >
              <PencilIcon className="size-4" />
            </Button>
          ) : null}
          {canDeleteCategory && onDeleteCategory ? (
            <ConfirmAction
              title="حذف القسم؟"
              description="سيتم حذف القسم وكل منتجاته. لا يمكن التراجع عن هذا الإجراء."
              confirmLabel="حذف القسم"
              onConfirm={() => onDeleteCategory(category)}
            >
              {(open) => (
                <Button size="icon" variant="ghost" aria-label="حذف القسم" onClick={open}>
                  <TrashIcon className="size-4 text-red-600" />
                </Button>
              )}
            </ConfirmAction>
          ) : null}
        </div>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="rounded-xl bg-zinc-50 px-3 py-4 text-center text-sm text-zinc-500">
            لا توجد منتجات في هذا القسم
          </p>
        ) : (
          <ul className="grid gap-2">
            {products.map((product) => {
              const image = primaryImage(product);
              return (
                <li
                  key={product.id}
                  onDragOver={(event) => {
                    if (!productSortable) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = "move";
                    setOverId(product.id);
                  }}
                  onDrop={(event) => {
                    if (!productSortable) return;
                    event.preventDefault();
                    event.stopPropagation();
                    handleDrop(product.id);
                  }}
                  onDragLeave={() => {
                    if (overId === product.id) setOverId(null);
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/70 p-2",
                    draggingId === product.id && "opacity-50",
                    overId === product.id && draggingId !== product.id && "border-teal-600 ring-2 ring-teal-700/20"
                  )}
                >
                  {productSortable ? (
                    <span
                      draggable
                      role="button"
                      tabIndex={0}
                      aria-label={`إعادة ترتيب ${product.name_ar}`}
                      className="cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", product.id);
                        productDragActive = true;
                        setDraggingId(product.id);
                      }}
                      onDragEnd={() => {
                        productDragActive = false;
                        setDraggingId(null);
                        setOverId(null);
                      }}
                    >
                      <GripIcon className="size-4" />
                    </span>
                  ) : null}
                  <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-zinc-200">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt="" className="size-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900">{product.name_ar}</p>
                    {product.name_en ? (
                      <p className="truncate text-xs text-zinc-400">{product.name_en}</p>
                    ) : null}
                  </div>
                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <StatusBadge kind="product" value={product.status} />
                    <span className="text-sm font-medium text-teal-800">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-teal-800 sm:hidden">
                    {formatPrice(product.price, product.currency)}
                  </span>
                  {canEdit && onEditProduct ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`تعديل ${product.name_ar}`}
                      onClick={() => onEditProduct(product, category)}
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                  ) : null}
                  {canDeleteProduct && onDeleteProduct ? (
                    <ConfirmAction
                      title="حذف المنتج؟"
                      description={`سيتم حذف «${product.name_ar}» من القسم.`}
                      confirmLabel="حذف المنتج"
                      onConfirm={() => onDeleteProduct(product, category)}
                    >
                      {(open) => (
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`حذف ${product.name_ar}`}
                          onClick={open}
                        >
                          <TrashIcon className="size-4 text-red-600" />
                        </Button>
                      )}
                    </ConfirmAction>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
