"use client";

import { cn } from "@/core/lib/cn";
import { SearchIcon, SlidersIcon, XIcon } from "@/core/ui/icons";

export function PublicMenuSearch({
  value,
  onChange,
  onFilterClick,
  filterActive = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  filterActive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 min-[380px]:gap-3", className)}>
      <div className="relative min-w-0 flex-1">
        <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-5 -translate-y-1/2 text-[var(--mh-text)]/40 min-[380px]:start-4" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="ابحث من هنا..."
          aria-label="ابحث من هنا"
          className="h-12 w-full rounded-2xl border-0 bg-white pe-10 ps-11 text-sm text-[var(--mh-text)] shadow-[0_10px_28px_rgba(0,0,0,0.06)] outline-none ring-1 ring-black/5 placeholder:text-[var(--mh-text)]/40 focus:ring-2 focus:ring-[var(--mh-primary)]/35 min-[380px]:h-14 min-[380px]:ps-12"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--mh-text)]/40"
            aria-label="مسح البحث"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>
      {onFilterClick ? (
        <button
          type="button"
          onClick={onFilterClick}
          className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--mh-primary)] text-white shadow-[0_10px_28px_rgba(0,0,0,0.12)] min-[380px]:size-14"
          aria-label="خيارات التصفية"
          aria-pressed={filterActive}
        >
          <SlidersIcon className="size-5" />
          {filterActive ? (
            <span className="absolute top-2 end-2 size-2.5 rounded-full bg-white ring-2 ring-[var(--mh-primary)]" />
          ) : null}
        </button>
      ) : null}
    </div>
  );
}
