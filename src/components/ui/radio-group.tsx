"use client";

import { cn } from "@/components/lib/cn";

export type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  className?: string;
};

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  className,
}: RadioGroupProps) {
  return (
    <div role="radiogroup" className={cn("grid gap-2", className)}>
      {options.map((option) => {
        const checked = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition",
              checked ? "border-teal-600 bg-teal-50/60" : "border-zinc-200 hover:bg-zinc-50",
              option.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={checked}
              disabled={option.disabled}
              onChange={() => onChange?.(option.value)}
              className="mt-0.5 accent-teal-700"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">{option.label}</span>
              {option.description ? (
                <span className="mt-0.5 block text-xs text-zinc-500">{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
