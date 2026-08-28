import { CategoryActions } from "@/components/categories/category-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon } from "@/components/ui/icons";
import type { Category } from "@/lib/types";

export function CategoryCard({
  category,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  category: Category;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="h-32 bg-zinc-100">
        {category.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={category.image_url}
            alt={category.name_ar}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <ImageIcon className="size-8" />
          </div>
        )}
      </div>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-900">{category.name_ar}</p>
            {category.name_en ? (
              <p className="truncate text-sm text-zinc-500">{category.name_en}</p>
            ) : null}
          </div>
          <CategoryActions
            category={category}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant={category.is_active ? "success" : "outline"} dot>
            {category.is_active ? "نشط" : "غير نشط"}
          </Badge>
          <span className="text-xs text-zinc-400">الترتيب: {category.sort_order}</span>
        </div>
      </CardContent>
    </Card>
  );
}
