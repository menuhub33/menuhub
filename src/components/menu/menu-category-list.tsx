"use client";

import { useState } from "react";
import { cn } from "@/components/lib/cn";
import type { CategoryWithProducts, ProductWithRelations } from "@/components/lib/types";
import { isProductDragActive, MenuCategoryCard } from "@/components/menu/menu-category-card";
import { GripIcon } from "@/components/ui/icons";

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

export function MenuCategoryList({
  categories,
  sortable,
  canEdit,
  canDeleteCategory,
  canDeleteProduct,
  onEditCategory,
  onDeleteCategory,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onReorder,
  onReorderProducts,
}: {
  categories: CategoryWithProducts[];
  sortable?: boolean;
  canEdit?: boolean;
  canDeleteCategory?: boolean;
  canDeleteProduct?: boolean;
  onEditCategory?: (category: CategoryWithProducts) => void;
  onDeleteCategory?: (category: CategoryWithProducts) => void;
  onAddProduct?: (category: CategoryWithProducts) => void;
  onEditProduct?: (product: ProductWithRelations, category: CategoryWithProducts) => void;
  onDeleteProduct?: (product: ProductWithRelations, category: CategoryWithProducts) => void;
  onReorder?: (ids: string[]) => void;
  onReorderProducts?: (categoryId: string, ids: string[]) => void;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const canSort = Boolean(sortable && canEdit && onReorder);

  function handleDrop(targetId: string) {
    if (!draggingId || !onReorder) return;
    onReorder(
      reorderIds(
        categories.map((category) => category.id),
        draggingId,
        targetId
      )
    );
    setDraggingId(null);
    setOverId(null);
  }

  return (
    <ul className="grid gap-4">
      {categories.map((category) => (
        <li
          key={category.id}
          onDragOver={(event) => {
            if (!canSort || isProductDragActive()) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setOverId(category.id);
          }}
          onDrop={(event) => {
            if (!canSort || isProductDragActive()) return;
            event.preventDefault();
            handleDrop(category.id);
          }}
          onDragLeave={() => {
            if (overId === category.id) setOverId(null);
          }}
          className={cn(
            draggingId === category.id && "opacity-60",
            overId === category.id && draggingId !== category.id && "rounded-2xl ring-2 ring-teal-700/30"
          )}
        >
          <MenuCategoryCard
            category={category}
            canEdit={canEdit}
            canDeleteCategory={canDeleteCategory}
            canDeleteProduct={canDeleteProduct}
            sortableProducts={canEdit}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onAddProduct={onAddProduct}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onReorderProducts={onReorderProducts}
            dragHandle={
              canSort ? (
                <span
                  draggable
                  role="button"
                  tabIndex={0}
                  aria-label={`إعادة ترتيب قسم ${category.name_ar}`}
                  className="mt-0.5 cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing"
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", category.id);
                    event.dataTransfer.setData("text/category-id", category.id);
                    setDraggingId(category.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setOverId(null);
                  }}
                >
                  <GripIcon className="size-5" />
                </span>
              ) : null
            }
          />
        </li>
      ))}
    </ul>
  );
}
