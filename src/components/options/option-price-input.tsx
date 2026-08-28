"use client";

import { useState } from "react";
import { currencyLabel, formatPrice } from "@/components/lib/format";
import { Input } from "@/components/ui/input";

export function OptionPriceInput({
  value,
  onChange,
  currency = "SYP",
  id,
  disabled,
  invalid,
}: {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const [text, setText] = useState(String(value));
  const [syncedValue, setSyncedValue] = useState(value);
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (!(text === "" || text === "-" || text === "." || text === "-.") && Number(text) !== value) {
      setText(String(value));
    }
  }

  function handleChange(raw: string) {
    if (raw === "" || raw === "-" || raw === "." || raw === "-.") {
      setText(raw);
      if (raw === "") onChange(0);
      return;
    }
    if (!/^-?\d*\.?\d*$/.test(raw)) return;
    setText(raw);
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) onChange(parsed);
  }

  return (
    <div className="grid gap-1.5">
      <div className="relative">
        <Input
          id={id}
          dir="ltr"
          inputMode="decimal"
          value={text}
          disabled={disabled}
          invalid={invalid}
          className="pe-14"
          onChange={(event) => handleChange(event.target.value)}
          aria-label="فرق السعر"
        />
        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
          {currencyLabel(currency)}
        </span>
      </div>
      <p className="text-xs text-zinc-500">
        {value === 0
          ? "بدون تكلفة إضافية"
          : value > 0
            ? `يُضاف ${formatPrice(value, currency)}`
            : `يُخصم ${formatPrice(Math.abs(value), currency)}`}
      </p>
    </div>
  );
}
