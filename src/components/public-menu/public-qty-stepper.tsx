"use client";

import { cn } from "@/components/lib/cn";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";

export function PublicQtyStepper({
  value,
  onChange,
  disabled = false,
  variant = "compact",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  variant?: "compact" | "gold" | "cart";
  className?: string;
}) {
  const gold = variant === "gold";
  const cart = variant === "cart";

  return (
    <div
      dir="ltr"
      className={cn(
        "inline-flex items-center",
        gold ? "gap-3" : cart ? "gap-1" : "rounded-lg bg-[var(--mh-text)]/8 px-0.5 py-0.5",
        className
      )}
    >
      <button
        type="button"
        aria-label="إنقاص الكمية"
        disabled={disabled || value <= 0}
        className={cn(
          "flex items-center justify-center disabled:opacity-30",
          gold
            ? "size-9 rounded-full bg-[var(--mh-primary)] text-white"
            : cart
              ? "size-7 text-sky-600"
              : "size-6 rounded-md text-[var(--mh-text)]/70"
        )}
        onClick={(event) => {
          event.stopPropagation();
          onChange(Math.max(0, value - 1));
        }}
      >
        <MinusIcon className={gold ? "size-4" : "size-3.5"} />
      </button>
      <span
        lang="en"
        dir="ltr"
        className={cn(
          "min-w-5 text-center font-bold tabular-nums",
          gold ? "min-w-8 text-xl" : "text-xs"
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="زيادة الكمية"
        disabled={disabled}
        className={cn(
          "flex items-center justify-center disabled:opacity-30",
          gold
            ? "size-9 rounded-full bg-[var(--mh-primary)] text-white"
            : cart
              ? "size-7 text-sky-600"
              : "size-6 rounded-md text-[var(--mh-text)]/70"
        )}
        onClick={(event) => {
          event.stopPropagation();
          onChange(value + 1);
        }}
      >
        <PlusIcon className={gold ? "size-4" : "size-3.5"} />
      </button>
    </div>
  );
}
