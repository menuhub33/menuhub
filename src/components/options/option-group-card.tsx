"use client";

import { ConfirmAction } from "@/components/common/confirm-action";
import type { OptionGroupWithOptions } from "@/components/lib/types";
import { OptionList } from "@/components/options/option-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import type { ProductOption } from "@/lib/types";

const SELECTION_LABELS = {
  SINGLE: "اختيار واحد",
  MULTIPLE: "اختيار متعدد",
} as const;

export function OptionGroupCard({
  group,
  currency = "SYP",
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onAddOption,
  onEditOption,
  onDeleteOption,
  onReorderOptions,
}: {
  group: OptionGroupWithOptions;
  currency?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (group: OptionGroupWithOptions) => void;
  onDelete?: (group: OptionGroupWithOptions) => void;
  onAddOption?: (group: OptionGroupWithOptions) => void;
  onEditOption?: (option: ProductOption, group: OptionGroupWithOptions) => void;
  onDeleteOption?: (option: ProductOption, group: OptionGroupWithOptions) => void;
  onReorderOptions?: (groupId: string, ids: string[]) => void;
}) {
  const options = group.options ?? [];
  const maxLabel = group.max_selection == null ? "بدون حد" : String(group.max_selection);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="truncate">{group.name_ar}</CardTitle>
              <Badge variant="teal">{SELECTION_LABELS[group.selection_type]}</Badge>
              {group.is_required ? <Badge variant="warning">إلزامي</Badge> : <Badge variant="outline">اختياري</Badge>}
            </div>
            {group.name_en ? (
              <p className="mt-0.5 truncate text-sm text-zinc-500">{group.name_en}</p>
            ) : null}
            <p className="mt-1 text-xs text-zinc-400">
              الحد الأدنى {group.min_selection} — الحد الأقصى {maxLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {canEdit && onAddOption ? (
              <Button size="sm" variant="outline" onClick={() => onAddOption(group)}>
                <PlusIcon className="size-4" />
                خيار
              </Button>
            ) : null}
            {canEdit && onEdit ? (
              <Button
                size="icon"
                variant="ghost"
                aria-label={`تعديل ${group.name_ar}`}
                onClick={() => onEdit(group)}
              >
                <PencilIcon className="size-4" />
              </Button>
            ) : null}
            {canDelete && onDelete ? (
              <ConfirmAction
                title="حذف مجموعة الخيارات؟"
                description={`سيتم حذف «${group.name_ar}» وكل خياراتها.`}
                confirmLabel="حذف المجموعة"
                onConfirm={() => onDelete(group)}
              >
                {(open) => (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`حذف ${group.name_ar}`}
                    onClick={open}
                  >
                    <TrashIcon className="size-4 text-red-600" />
                  </Button>
                )}
              </ConfirmAction>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <OptionList
          options={options}
          currency={currency}
          sortable={canEdit}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={onEditOption ? (option) => onEditOption(option, group) : undefined}
          onDelete={onDeleteOption ? (option) => onDeleteOption(option, group) : undefined}
          onReorder={
            onReorderOptions ? (ids) => onReorderOptions(group.id, ids) : undefined
          }
        />
      </CardContent>
    </Card>
  );
}
