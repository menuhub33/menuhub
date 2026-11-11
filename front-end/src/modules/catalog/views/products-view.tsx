"use client";

import { useMemo, useState } from "react";
import { reloadPage } from "@/core/lib/reload";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/modules/catalog/actions/products";
import { duplicateProduct } from "@/modules/catalog/actions/products";
import { updateProductStatus } from "@/modules/catalog/actions/products";
import { PageHeader } from "@/core/components/layout/page-header";
import { ProductList } from "@/modules/catalog/components/products/product-list";
import { DeleteProductDialog } from "@/modules/catalog/components/products/delete-product-dialog";
import { DuplicateProductDialog } from "@/modules/catalog/components/products/duplicate-product-dialog";
import { Button } from "@/core/ui/button";
import { Select } from "@/core/ui/select";
import { useToast } from "@/core/ui/toast";
import { hasDiscount } from "@/modules/catalog/lib/merchandising";
import type { ProductWithImages } from "@/modules/catalog/types";
import type { Category, ProductStatus } from "@/modules/catalog/types";

type HighlightFilter = "ALL" | "FEATURED" | "DISCOUNT";

export function ProductsView({
  products,
  categories,
  canEdit,
  canDelete,
  showStockCount = true,
}: {
  products: ProductWithImages[];
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
  showStockCount?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [highlight, setHighlight] = useState<HighlightFilter>("ALL");
  const [sort, setSort] = useState("order");
  const [deleting, setDeleting] = useState<ProductWithImages | null>(null);
  const [duplicating, setDuplicating] = useState<ProductWithImages | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => (status === "ALL" ? true : product.status === status))
      .filter((product) => (categoryId === "ALL" ? true : product.category_id === categoryId))
      .filter((product) => {
        if (highlight === "ALL") return true;
        if (highlight === "FEATURED") return product.is_featured;
        return hasDiscount(product);
      })
      .filter((product) =>
        !query
          ? true
          : `${product.name_ar} ${product.name_en ?? ""} ${product.description_ar ?? ""}`
              .toLowerCase()
              .includes(query)
      )
      .sort((a, b) => {
        if (sort === "price") {
          if (a.price == null && b.price == null) return 0;
          if (a.price == null) return 1;
          if (b.price == null) return -1;
          return a.price - b.price;
        }
        if (sort === "name") return a.name_ar.localeCompare(b.name_ar, "ar");
        const categoryA = categories.findIndex((category) => category.id === a.category_id);
        const categoryB = categories.findIndex((category) => category.id === b.category_id);
        return categoryA - categoryB || a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at);
      });
  }, [products, categories, search, status, categoryId, highlight, sort]);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="المنتجات"
        description="ابحث وصفِّ وعدّل منتجات المنيو."
        breadcrumbs={[
          { label: "الرئيسية", href: "/dashboard" },
          { label: "المنيو", href: "/dashboard/menu" },
          { label: "المنتجات" },
        ]}
        actions={
          canEdit ? (
            <Button onClick={() => router.push("/dashboard/menu/products/new")}>
              إضافة منتج
            </Button>
          ) : null
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={categoryId}
          onChange={setCategoryId}
          options={[
            { value: "ALL", label: "كل الأقسام" },
            ...categories.map((category) => ({ value: category.id, label: category.name_ar })),
          ]}
        />
        <Select
          value={highlight}
          onChange={(value) => setHighlight(value as HighlightFilter)}
          options={[
            { value: "ALL", label: "كل المنتجات" },
            { value: "FEATURED", label: "منتجات مميزة" },
            { value: "DISCOUNT", label: "حسومات" },
          ]}
        />
        <Select
          value={sort}
          onChange={setSort}
          options={[
            { value: "order", label: "الترتيب" },
            { value: "name", label: "الاسم" },
            { value: "price", label: "السعر" },
          ]}
        />
      </div>
        <ProductList
          products={filtered}
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={(value) => setStatus(value)}
          canEdit={canEdit}
          canDelete={canDelete}
          onCreate={() => router.push("/dashboard/menu/products/new")}
          onEdit={(product) => router.push(`/dashboard/menu/products/${product.id}/edit`)}
          onDelete={setDeleting}
          onDuplicate={setDuplicating}
          onToggleAvailability={async (product) => {
            const next = product.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
            const result = await updateProductStatus(product.id, next);
            if (result.error) toast({ title: result.error, variant: "error" });
            else reloadPage();
          }}
          showStockCount={showStockCount}
          onToggleVisibility={async (product) => {
            const next = product.status === "HIDDEN" ? "AVAILABLE" : "HIDDEN";
            const result = await updateProductStatus(product.id, next);
            if (result.error) toast({ title: result.error, variant: "error" });
            else reloadPage();
          }}
        />
      <DeleteProductDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        productName={deleting?.name_ar}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteProduct(deleting.id);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم حذف المنتج", variant: "success" });
            setDeleting(null);
            reloadPage();
          }
        }}
      />
      <DuplicateProductDialog
        open={Boolean(duplicating)}
        onOpenChange={(open) => {
          if (!open) setDuplicating(null);
        }}
        product={duplicating}
        onConfirm={async (name) => {
          if (!duplicating) return;
          const result = await duplicateProduct(duplicating.id, name);
          if (result.error) toast({ title: result.error, variant: "error" });
          else {
            toast({ title: "تم نسخ المنتج بنجاح", variant: "success" });
            setDuplicating(null);
            reloadPage();
          }
        }}
      />
    </div>
  );
}
