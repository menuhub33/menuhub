"use client";

import { EmptyState } from "@/components/common/empty-state";
import type { OptionGroupWithOptions } from "@/components/lib/types";
import { OptionGroupCard } from "@/components/options/option-group-card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import type { ProductOption } from "@/lib/types";

export function OptionGroupList({
  groups,
  currency = "SYP",
  canEdit,
  canDelete,
  onAdd,
  onEdit,
  onDelete,
  onAddOption,
  onEditOption,
  onDeleteOption,
  onReorderOptions,
}: {
  groups: OptionGroupWithOptions[];
  currency?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onAdd?: () => void;
  onEdit?: (group: OptionGroupWithOptions) => void;
  onDelete?: (group: OptionGroupWithOptions) => void;
  onAddOption?: (group: OptionGroupWithOptions) => void;
  onEditOption?: (option: ProductOption, group: OptionGroupWithOptions) => void;
  onDeleteOption?: (option: ProductOption, group: OptionGroupWithOptions) => void;
  onReorderOptions?: (groupId: string, ids: string[]) => void;
}) {
  if (groups.length === 0) {
    return (
      <EmptyState
        title="لا توجد مجموعات خيارات"
        description="أضف مجموعة مثل الحجم أو الإضافات ليختار منها الزبون."
        action={
          canEdit && onAdd ? (
            <Button onClick={onAdd}>
              <PlusIcon className="size-4" />
              إضافة مجموعة
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
            إضافة مجموعة
          </Button>
        </div>
      ) : null}
      <ul className="grid gap-4">
        {groups.map((group) => (
          <li key={group.id}>
            <OptionGroupCard
              group={group}
              currency={currency}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddOption={onAddOption}
              onEditOption={onEditOption}
              onDeleteOption={onDeleteOption}
              onReorderOptions={onReorderOptions}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
