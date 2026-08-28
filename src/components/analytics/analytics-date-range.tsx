"use client";

import { useId } from "react";
import { cn } from "@/components/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/form-field";

export type DateRangeValue = {
  from: string;
  to: string;
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return toIsoDate(date);
}

const PRESETS = [
  { id: "today", label: "اليوم", from: () => daysAgo(0), to: () => daysAgo(0) },
  { id: "7d", label: "7 أيام", from: () => daysAgo(6), to: () => daysAgo(0) },
  { id: "30d", label: "30 يوم", from: () => daysAgo(29), to: () => daysAgo(0) },
] as const;

export function AnalyticsDateRange({
  from,
  to,
  onChange,
  className,
}: {
  from: string;
  to: string;
  onChange: (range: DateRangeValue) => void;
  className?: string;
}) {
  const fromId = useId();
  const toId = useId();
  const today = daysAgo(0);

  function commit(nextFrom: string, nextTo: string) {
    if (nextFrom && nextTo && nextFrom > nextTo) {
      onChange({ from: nextTo, to: nextFrom });
      return;
    }
    onChange({ from: nextFrom, to: nextTo });
  }

  const activePreset = PRESETS.find(
    (preset) => preset.from() === from && preset.to() === to
  )?.id;

  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            size="sm"
            variant={activePreset === preset.id ? "primary" : "outline"}
            onClick={() => onChange({ from: preset.from(), to: preset.to() })}
          >
            {preset.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <FormField label="من" htmlFor={fromId}>
          <Input
            id={fromId}
            type="date"
            value={from}
            max={today}
            onChange={(event) => commit(event.target.value, to)}
          />
        </FormField>
        <FormField label="إلى" htmlFor={toId}>
          <Input
            id={toId}
            type="date"
            value={to}
            max={today}
            onChange={(event) => commit(from, event.target.value)}
          />
        </FormField>
      </div>
    </div>
  );
}
