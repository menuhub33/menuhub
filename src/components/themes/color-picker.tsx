"use client";

import { useId } from "react";
import { cn } from "@/components/lib/cn";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";

const HEX6 = /^#([0-9A-Fa-f]{6})$/;
const HEX3 = /^#([0-9A-Fa-f]{3})$/;

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (HEX6.test(trimmed)) return trimmed.toUpperCase();
  const short = trimmed.match(HEX3);
  if (short?.[1]) {
    const [r, g, b] = short[1].split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return "#000000";
}

function isValidHex(value: string): boolean {
  const trimmed = value.trim();
  return HEX6.test(trimmed) || HEX3.test(trimmed);
}

export function ColorPicker({
  label,
  value,
  onChange,
  hint,
  error,
  disabled,
  id,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const colorId = `${inputId}-swatch`;
  const textValue = value.startsWith("#") ? value : `#${value}`;

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      hint={hint}
      error={error}
      className={className}
    >
      <div className="flex items-center gap-2">
        <label
          htmlFor={colorId}
          className={cn(
            "relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          <span
            className="absolute inset-0"
            style={{ backgroundColor: isValidHex(textValue) ? normalizeHex(textValue) : "#E4E4E7" }}
          />
          <input
            id={colorId}
            type="color"
            disabled={disabled}
            value={isValidHex(textValue) ? normalizeHex(textValue) : "#000000"}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={label}
          />
        </label>
        <Input
          id={inputId}
          dir="ltr"
          disabled={disabled}
          value={textValue}
          maxLength={7}
          placeholder="#0F766E"
          invalid={Boolean(error) || (textValue.length > 0 && !isValidHex(textValue))}
          onChange={(event) => {
            const next = event.target.value.startsWith("#")
              ? event.target.value
              : `#${event.target.value}`;
            onChange(next);
          }}
          className="font-mono uppercase tracking-wide"
        />
      </div>
    </FormField>
  );
}
