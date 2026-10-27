"use client";

import { ErrorState } from "@/core/components/common/error-state";
import { LoadingState } from "@/core/components/common/loading-state";
import type { CategoryWithProducts, MenuWithCategories, ProductWithRelations } from "@/modules/catalog/types";
import { MenuCategoryList } from "@/modules/catalog/components/menu/menu-category-list";
import { MenuEmptyState } from "@/modules/catalog/components/menu/menu-empty-state";
import { MenuHeader } from "@/modules/catalog/components/menu/menu-header";
import { Button } from "@/core/ui/button";
import { PlusIcon } from "@/core/ui/icons";

export function MenuBuilder({
  menu,
  loading,
  error,
  onRetry,
  canEdit,
  canDeleteCategory,
  canDeleteProduct,
  canPublish,
  onPublish,
  onUnpublish,
  onPreview,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onReorderCategories,
  onReorderProducts,
}: {
  menu: MenuWithCategories;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  canEdit?: boolean;
  canDeleteCategory?: boolean;
  canDeleteProduct?: boolean;
  canPublish?: boolean;
  onPublish?: () => void;
  onUnpublish?: () => void;
  onPreview?: () => void;
  onAddCategory: () => void;
  onEditCategory: (category: CategoryWithProducts) => void;
  onDeleteCategory: (category: CategoryWithProducts) => void;
  onAddProduct: (category: CategoryWithProducts) => void;
  onEditProduct: (product: ProductWithRelations, category: CategoryWithProducts) => void;
  onDeleteProduct?: (product: ProductWithRelations, category: CategoryWithProducts) => void;
  onReorderCategories: (ids: string[]) => void;
  onReorderProducts: (categoryId: string, ids: string[]) => void;
}) {
  if (loading) {
    return <LoadingState label="جارٍ تحميل المنيو..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  const categories = menu.categories ?? [];

  return (
    <div className="grid gap-5">
      <MenuHeader
        menu={menu}
        canPublish={canPublish}
        onPublish={onPublish}
        onUnpublish={onUnpublish}
        onPreview={onPreview}
      />
      {categories.length === 0 ? (
        <MenuEmptyState onAdd={canEdit ? onAddCategory : undefined} />
      ) : (
        <>
          {canEdit ? (
            <div className="flex justify-end">
              <Button onClick={onAddCategory}>
                <PlusIcon className="size-4" />
                إضافة قسم
              </Button>
            </div>
          ) : null}
          <MenuCategoryList
            categories={categories}
            sortable={canEdit}
            canEdit={canEdit}
            canDeleteCategory={canDeleteCategory}
            canDeleteProduct={canDeleteProduct}
            onEditCategory={onEditCategory}
            onDeleteCategory={onDeleteCategory}
            onAddProduct={onAddProduct}
            onEditProduct={onEditProduct}
            onDeleteProduct={onDeleteProduct}
            onReorder={onReorderCategories}
            onReorderProducts={onReorderProducts}
          />
        </>
      )}
    </div>
  );
}
