"use client";

import { cn } from "@/components/lib/cn";

export type TabItem = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type TabsProps = {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
};

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "min-w-0 flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
              selected
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900",
              tab.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
