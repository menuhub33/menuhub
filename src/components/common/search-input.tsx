"use client";

import { cn } from "@/components/lib/cn";
import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon } from "@/components/ui/icons";

export function SearchInput({
  value,
  onChange,
  placeholder = "بحث...",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pe-10 ps-10"
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
          aria-label="مسح البحث"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
