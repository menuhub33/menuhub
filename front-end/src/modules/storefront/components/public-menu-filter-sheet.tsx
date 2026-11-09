"use client";

import { useState } from "react";
import { currencySymbol } from "@/core/lib/format";
import { cn } from "@/core/lib/cn";
import { ChevronDownIcon } from "@/core/ui/icons";
import { PublicSheet } from "@/modules/storefront/components/public-sheet";

export type MenuSort = "name" | "price-asc" | "price-desc" | "popular";

export type MenuFilters = {
  min: string;
  max: string;
  sort: MenuSort;
  featured: boolean;
  discounted: boolean;
};

export const EMPTY_MENU_FILTERS: MenuFilters = {
  min: "",
  max: "",
  sort: "name",
  featured: false,
  discounted: false,
};

const SORT_OPTIONS: { value: MenuSort; label: string }[] = [
  { value: "name", label: "الاسم (أ-ي)" },
  { value: "price-asc", label: "السعر (من الأقل للأعلى)" },
  { value: "price-desc", label: "السعر (من الأعلى للأقل)" },
  { value: "popular", label: "الأكثر شعبية" },
];

export function PublicMenuFilterSheet({
  open,
  onOpenChange,
  value,
  currency,
  onApply,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: MenuFilters;
  currency: string;
  onApply: (filters: MenuFilters) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [shown, setShown] = useState(open);
  const [sortOpen, setSortOpen] = useState(false);
  const symbol = currencySymbol(currency);

  if (open !== shown) {
    setShown(open);
    if (open) {
      setDraft(value);
      setSortOpen(false);
    }
  }

  const selected = SORT_OPTIONS.find((option) => option.value === draft.sort) ?? SORT_OPTIONS[0];

  return (
    <PublicSheet open={open} onOpenChange={onOpenChange} hideHeader scrollable={false} size="sm">
      <div className="grid gap-5">
        <div className="relative flex h-12 items-center justify-center rounded-xl bg-[var(--mh-primary)] text-white">
          <h2 className="text-base font-bold">خيارات التصفية</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute end-3 flex size-7 items-center justify-center rounded-lg text-lg leading-none text-white/90 hover:bg-white/15"
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-bold">نطاق السعر</p>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <PriceBound
              label="أدنى"
              symbol={symbol}
              value={draft.min}
              onChange={(min) => setDraft((current) => ({ ...current, min }))}
            />
            <span className="text-zinc-400">-</span>
            <PriceBound
              label="أعلى"
              symbol={symbol}
              value={draft.max}
              onChange={(max) => setDraft((current) => ({ ...current, max }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FilterToggle
            label="المميز"
            checked={draft.featured}
            onChange={(featured) => setDraft((current) => ({ ...current, featured }))}
          />
          <FilterToggle
            label="الحسومات"
            checked={draft.discounted}
            onChange={(discounted) => setDraft((current) => ({ ...current, discounted }))}
          />
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-bold">ترتيب حسب</p>
          <div className="relative">
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={sortOpen}
              onClick={() => setSortOpen((current) => !current)}
              className="flex h-12 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 text-sm"
            >
              <span>{selected.label}</span>
              <ChevronDownIcon className={cn("size-4 opacity-60", sortOpen && "rotate-180")} />
            </button>
            {sortOpen ? (
              <ul
                role="listbox"
                className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
              >
                {SORT_OPTIONS.map((option) => {
                  const active = option.value === draft.sort;
                  return (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setDraft((current) => ({ ...current, sort: option.value }));
                          setSortOpen(false);
                        }}
                        className={cn(
                          "flex w-full px-3 py-2.5 text-start text-sm",
                          active
                            ? "bg-[var(--mh-primary)] font-semibold text-white"
                            : "hover:bg-zinc-50"
                        )}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onClear();
              onOpenChange(false);
            }}
            className="h-12 rounded-xl bg-zinc-500 text-sm font-bold text-white"
          >
            مسح
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
            className="h-12 rounded-xl bg-[var(--mh-primary)] text-sm font-bold text-white"
          >
            تطبيق
          </button>
        </div>
      </div>
    </PublicSheet>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "h-11 rounded-xl border text-sm font-bold",
        checked
          ? "border-[var(--mh-primary)] bg-[var(--mh-primary)] text-white"
          : "border-zinc-200 bg-white"
      )}
    >
      {label}
    </button>
  );
}

function PriceBound({
  label,
  symbol,
  value,
  onChange,
}: {
  label: string;
  symbol: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <input
        inputMode="decimal"
        value={value}
        placeholder={label}
        onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))}
        className="h-12 w-full rounded-xl border border-zinc-200 bg-white px-3 pe-8 text-sm outline-none focus:border-[var(--mh-primary)]"
      />
      <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
        {symbol}
      </span>
    </label>
  );
}
