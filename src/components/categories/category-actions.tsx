"use client";

import { ConfirmAction } from "@/components/common/confirm-action";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import type { Category } from "@/lib/types";

export function CategoryActions({
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
  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex items-center gap-1">
      {canEdit && onEdit ? (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`تعديل ${category.name_ar}`}
          onClick={() => onEdit(category)}
        >
          <PencilIcon className="size-4" />
        </Button>
      ) : null}
      {canDelete && onDelete ? (
        <ConfirmAction
          title="حذف القسم؟"
          description={`سيتم حذف «${category.name_ar}» وكل منتجاته. لا يمكن التراجع.`}
          confirmLabel="حذف القسم"
          onConfirm={() => onDelete(category)}
        >
          {(open) => (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`حذف ${category.name_ar}`}
              onClick={open}
            >
              <TrashIcon className="size-4 text-red-600" />
            </Button>
          )}
        </ConfirmAction>
      ) : null}
    </div>
  );
}
