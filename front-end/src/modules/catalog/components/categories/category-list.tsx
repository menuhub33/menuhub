import { CategoryCard } from "@/modules/catalog/components/categories/category-card";
import { EmptyState } from "@/core/components/common/empty-state";
import { ErrorState } from "@/core/components/common/error-state";
import { LoadingState } from "@/core/components/common/loading-state";
import { Button } from "@/core/ui/button";
import { PlusIcon, UtensilsIcon } from "@/core/ui/icons";
import type { Category } from "@/modules/catalog/types";

export function CategoryList({
  categories,
  loading,
  error,
  onRetry,
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onAdd?: () => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}) {
  if (loading) {
    return <LoadingState label="جارٍ تحميل الأقسام..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        icon={<UtensilsIcon className="size-7" />}
        title="لا توجد أقسام"
        description="أنشئ قسمًا مثل المشروبات أو المقبلات لبدء إضافة المنتجات."
        action={
          canEdit && onAdd ? (
            <Button onClick={onAdd}>
              <PlusIcon className="size-4" />
              إضافة قسم
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <div className="grid gap-4">
      {canEdit && onAdd ? (
        <div className="flex justify-end">
          <Button onClick={onAdd}>
            <PlusIcon className="size-4" />
            إضافة قسم
          </Button>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
