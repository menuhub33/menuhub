"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/components/lib/cn";
import { CheckIcon, ChevronDownIcon } from "@/components/ui/icons";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
};

export type SelectProps = {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  id?: string;
  className?: string;
};

export function Select({
  value,
  onChange,
  options,
  placeholder = "اختر",
  disabled,
  invalid,
  name,
  id,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name ? <input type="hidden" name={name} value={value ?? ""} /> : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 text-sm shadow-sm outline-none transition",
          "focus:border-teal-600 focus:ring-4 focus:ring-teal-700/15",
          "disabled:cursor-not-allowed disabled:bg-zinc-50",
          invalid ? "border-red-400" : "border-zinc-200",
          selected ? "text-zinc-900" : "text-zinc-400"
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon ? <span className="flex shrink-0 text-zinc-700">{selected.icon}</span> : null}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDownIcon className={cn("size-4 text-zinc-500", open && "rotate-180")} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => {
                    onChange?.(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm",
                    option.disabled
                      ? "cursor-not-allowed text-zinc-400"
                      : "hover:bg-zinc-50",
                    isSelected && "bg-teal-50 text-teal-800"
                  )}
                >
                  {option.icon ? <span className="flex shrink-0">{option.icon}</span> : null}
                  <span className="flex-1">{option.label}</span>
                  {isSelected ? <CheckIcon className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
