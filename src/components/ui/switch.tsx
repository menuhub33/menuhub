"use client";

import { cn } from "@/components/lib/cn";

export type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  className?: string;
};

export function Switch({
  checked = false,
  onCheckedChange,
  disabled,
  label,
  id,
  className,
}: SwitchProps) {
  return (
    <label htmlFor={id} className={cn("inline-flex items-center gap-2", className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/20",
          checked ? "bg-teal-700" : "bg-zinc-300",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow transition-[inset-inline-start]",
            checked ? "start-5" : "start-0.5"
          )}
        />
      </button>
      {label ? <span className="text-sm text-zinc-800">{label}</span> : null}
    </label>
  );
}
