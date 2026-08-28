"use client";

import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { SearchInput } from "@/components/common/search-input";
import { PRODUCT_STATUS_LABELS } from "@/components/lib/labels";
import type { ProductWithImages } from "@/components/lib/types";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import { PlusIcon, UtensilsIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductStatus } from "@/lib/types";

type StatusFilter = ProductStatus | "ALL";

function ProductListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-zinc-200">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="grid gap-2 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductList({
  products,
  loading,
  error,
  search,
  onSearchChange,
  status,
  onStatusChange,
  onRetry,
  onCreate,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleAvailability,
  onToggleVisibility,
}: {
  products: ProductWithImages[];
  loading?: boolean;
  error?: string | null;
  search?: string;
  onSearchChange?: (value: string) => void;
  status?: StatusFilter;
  onStatusChange?: (status: StatusFilter) => void;
  onRetry?: () => void;
  onCreate?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (product: ProductWithImages) => void;
  onDelete?: (product: ProductWithImages) => void;
  onDuplicate?: (product: ProductWithImages) => void;
  onToggleAvailability?: (product: ProductWithImages) => void;
  onToggleVisibility?: (product: ProductWithImages) => void;
}) {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalStatus, setInternalStatus] = useState<StatusFilter>("ALL");
  const searchValue = search ?? internalSearch;
  const statusValue = status ?? internalStatus;

  function handleSearch(value: string) {
    setInternalSearch(value);
    onSearchChange?.(value);
  }

  function handleStatus(value: string) {
    const next = value as StatusFilter;
    setInternalStatus(next);
    onStatusChange?.(next);
  }

  const query = searchValue.trim().toLowerCase();
  const filtered = products.filter((product) => {
    if (statusValue !== "ALL" && product.status !== statusValue) return false;
    if (!query) return true;
    const haystack = `${product.name_ar} ${product.name_en ?? ""} ${product.description_ar ?? ""}`.toLowerCase();
    return haystack.includes(query);
  });

  const addButton = onCreate ? (
    <Button onClick={onCreate}>
      <PlusIcon className="size-4" />
      إضافة منتج
    </Button>
  ) : null;

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchValue}
          onChange={handleSearch}
          placeholder="ابحث عن منتج..."
          className="flex-1"
        />
        <Select
          value={statusValue}
          onChange={handleStatus}
          options={[
            { value: "ALL", label: "كل الحالات" },
            { value: "AVAILABLE", label: PRODUCT_STATUS_LABELS.AVAILABLE },
            { value: "UNAVAILABLE", label: PRODUCT_STATUS_LABELS.UNAVAILABLE },
            { value: "HIDDEN", label: PRODUCT_STATUS_LABELS.HIDDEN },
          ]}
          className="sm:w-44"
        />
        {addButton}
      </div>
      {loading ? (
        <ProductListSkeleton />
      ) : error ? (
        <ErrorState title="تعذر تحميل المنتجات" description={error} onRetry={onRetry} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<UtensilsIcon className="size-7" />}
          title="لا توجد منتجات"
          description="أضف أول منتج لبدء بناء المنيو."
          action={
            onCreate ? (
              <Button onClick={onCreate}>
                <PlusIcon className="size-4" />
                إضافة أول منتج
              </Button>
            ) : null
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="لا توجد نتائج" description="جرّب تغيير كلمة البحث أو فلتر الحالة." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
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
      )}
    </div>
  );
}
