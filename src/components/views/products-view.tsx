"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/actions/products/deleteProduct";
import { duplicateProduct } from "@/actions/products/duplicateProduct";
import { updateProductStatus } from "@/actions/products/updateProductStatus";
import { PageHeader } from "@/components/layout/page-header";
import { ProductList } from "@/components/products/product-list";
import { DeleteProductDialog } from "@/components/products/delete-product-dialog";
import { DuplicateProductDialog } from "@/components/products/duplicate-product-dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import type { ProductWithImages } from "@/components/lib/types";
import type { Category, ProductStatus } from "@/lib/types";

export function ProductsView({
  products,
  categories,
  canEdit,
  canDelete,
}: {
  products: ProductWithImages[];
  categories: Category[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "ALL">("ALL");
  const [categoryId, setCategoryId] = useState("ALL");
  const [sort, setSort] = useState("order");
  const [deleting, setDeleting] = useState<ProductWithImages | null>(null);
  const [duplicating, setDuplicating] = useState<ProductWithImages | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products
      .filter((product) => (status === "ALL" ? true : product.status === status))
      .filter((product) => (categoryId === "ALL" ? true : product.category_id === categoryId))
      .filter((product) =>
        !query
          ? true
          : `${product.name_ar} ${product.name_en ?? ""} ${product.description_ar ?? ""}`
              .toLowerCase()
              .includes(query)
      )
      .sort((a, b) => {
        if (sort === "price") return a.price - b.price;
        if (sort === "name") return a.name_ar.localeCompare(b.name_ar, "ar");
        return a.sort_order - b.sort_order;
      });
  }, [products, search, status, categoryId, sort]);

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
            else router.refresh();
          }}
          onToggleVisibility={async (product) => {
            const next = product.status === "HIDDEN" ? "AVAILABLE" : "HIDDEN";
            const result = await updateProductStatus(product.id, next);
            if (result.error) toast({ title: result.error, variant: "error" });
            else router.refresh();
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
            router.refresh();
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
            router.refresh();
          }
        }}
      />
    </div>
  );
}
