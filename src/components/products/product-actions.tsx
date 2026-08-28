"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { CopyIcon, MoreHorizontalIcon, PencilIcon, TrashIcon } from "@/components/ui/icons";

export function ProductActions({
  canEdit,
  canDelete,
  canDuplicate,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  canEdit?: boolean;
  canDelete?: boolean;
  canDuplicate?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  const items = [
    canEdit && onEdit
      ? {
          id: "edit",
          label: "تعديل",
          icon: <PencilIcon className="size-4" />,
          onSelect: onEdit,
        }
      : null,
    canDuplicate && onDuplicate
      ? {
          id: "duplicate",
          label: "نسخ",
          icon: <CopyIcon className="size-4" />,
          onSelect: onDuplicate,
        }
      : null,
    canDelete && onDelete
      ? {
          id: "delete",
          label: "حذف",
          icon: <TrashIcon className="size-4" />,
          danger: true,
          onSelect: onDelete,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item != null);

  if (items.length === 0) return null;

  return (
    <DropdownMenu
      align="end"
      trigger={
        <Button variant="ghost" size="icon" aria-label="إجراءات المنتج">
          <MoreHorizontalIcon className="size-5" />
        </Button>
      }
      items={items}
    />
  );
}
