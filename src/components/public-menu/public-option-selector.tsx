"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import type { OptionGroupWithOptions } from "@/components/lib/types";
import type { ProductOption } from "@/lib/types";

function activeOptions(group: OptionGroupWithOptions): ProductOption[] {
  return [...(group.options ?? [])]
    .filter((option) => option.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

function minForGroup(group: OptionGroupWithOptions): number {
  return Math.max(group.min_selection, group.is_required ? 1 : 0);
}

function extraFromSelection(
  groups: OptionGroupWithOptions[],
  selected: Record<string, string[]>
): number {
  const deltas = new Map<string, number>();
  for (const group of groups) {
    for (const option of group.options ?? []) {
      deltas.set(option.id, option.price_delta);
    }
  }
  return Object.values(selected)
    .flat()
    .reduce((sum, id) => sum + (deltas.get(id) ?? 0), 0);
}

function initialSelection(groups: OptionGroupWithOptions[]): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  for (const group of groups) {
    const options = activeOptions(group);
    if (group.selection_type === "SINGLE" && minForGroup(group) > 0 && options[0]) {
      next[group.id] = [options[0].id];
    } else {
      next[group.id] = [];
    }
  }
  return next;
}

export function PublicOptionSelector({
  groups,
  currency,
  disabled = false,
  onChange,
  className,
}: {
  groups: OptionGroupWithOptions[];
  currency: string;
  disabled?: boolean;
  onChange?: (selectedIds: string[], extra: number) => void;
  className?: string;
}) {
  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.sort_order - b.sort_order),
    [groups]
  );

  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    initialSelection(sortedGroups)
  );

  const extra = extraFromSelection(sortedGroups, selected);

  function apply(next: Record<string, string[]>) {
    setSelected(next);
    onChange?.(Object.values(next).flat(), extraFromSelection(sortedGroups, next));
  }

  useEffect(() => {
    onChange?.(Object.values(selected).flat(), extra);
    // Notify parent of default required selections once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectSingle(groupId: string, optionId: string) {
    if (disabled) return;
    apply({ ...selected, [groupId]: [optionId] });
  }

  function toggleMultiple(group: OptionGroupWithOptions, optionId: string) {
    if (disabled) return;
    const max = group.max_selection;
    const currentIds = selected[group.id] ?? [];
    const exists = currentIds.includes(optionId);
    let nextIds = exists
      ? currentIds.filter((id) => id !== optionId)
      : [...currentIds, optionId];
    if (!exists && max != null && nextIds.length > max) {
      nextIds = currentIds;
    }
    apply({ ...selected, [group.id]: nextIds });
  }

  if (sortedGroups.length === 0) return null;

  return (
    <div className={cn("grid gap-5", disabled && "pointer-events-none opacity-60", className)}>
      {sortedGroups.map((group) => {
        const options = activeOptions(group);
        if (options.length === 0) return null;
        const chosen = selected[group.id] ?? [];
        const min = minForGroup(group);
        const max = group.max_selection;
        const underMin = chosen.length < min;

        return (
          <fieldset key={group.id} className="grid gap-2">
            <legend className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              {group.name_ar}
              {group.is_required ? (
                <span className="rounded-full bg-[var(--mh-primary)]/15 px-2 py-0.5 text-[10px] font-medium text-[var(--mh-primary)]">
                  مطلوب
                </span>
              ) : null}
              {group.name_en ? (
                <span className="text-xs font-normal opacity-50" dir="ltr">
                  {group.name_en}
                </span>
              ) : null}
            </legend>
            {min > 1 || max != null ? (
              <p className="text-xs opacity-60">
                {max != null ? `اختر من ${min} إلى ${max}` : `اختر ${min} على الأقل`}
              </p>
            ) : null}
            <div className="grid gap-2">
              {options.map((option) => {
                const checked = chosen.includes(option.id);
                const atMax =
                  group.selection_type === "MULTIPLE" &&
                  max != null &&
                  !checked &&
                  chosen.length >= max;
                const delta =
                  option.price_delta === 0
                    ? null
                    : `${option.price_delta > 0 ? "+" : ""}${formatPrice(option.price_delta, currency)}`;

                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm",
                      checked
                        ? "border-[var(--mh-primary)] bg-[var(--mh-primary)]/10"
                        : "border-[var(--mh-text)]/12",
                      atMax && "cursor-not-allowed opacity-50"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type={group.selection_type === "SINGLE" ? "radio" : "checkbox"}
                        name={`option-group-${group.id}`}
                        checked={checked}
                        disabled={disabled || atMax}
                        onChange={() =>
                          group.selection_type === "SINGLE"
                            ? selectSingle(group.id, option.id)
                            : toggleMultiple(group, option.id)
                        }
                        className="accent-[var(--mh-primary)]"
                      />
                      <span>
                        {option.name_ar}
                        {option.name_en ? (
                          <span className="ms-1 text-xs opacity-50" dir="ltr">
                            {option.name_en}
                          </span>
                        ) : null}
                      </span>
                    </span>
                    {delta ? <span className="shrink-0 text-xs font-medium opacity-80">{delta}</span> : null}
                  </label>
                );
              })}
            </div>
            {underMin ? (
              <p className="text-xs text-amber-700">يرجى اختيار العدد المطلوب</p>
            ) : null}
          </fieldset>
        );
      })}
      {extra !== 0 ? (
        <p className="text-sm font-medium">
          الإضافات: {extra > 0 ? "+" : ""}
          {formatPrice(extra, currency)}
        </p>
      ) : null}
    </div>
  );
}
