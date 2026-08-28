"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/lib/cn";

export type DropdownMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
};

export type DropdownMenuProps = {
  trigger: React.ReactNode;
  items: DropdownMenuItem[];
  align?: "start" | "end";
  className?: string;
};

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  className,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={rootRef} className={cn("relative inline-flex", className)}>
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute z-40 mt-2 min-w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg",
            align === "end" ? "end-0" : "start-0"
          )}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-start text-sm",
                item.danger ? "text-red-600 hover:bg-red-50" : "text-zinc-700 hover:bg-zinc-50",
                item.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
