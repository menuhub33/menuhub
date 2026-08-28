"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/components/lib/cn";

export type PopoverProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
};

export function Popover({ trigger, children, align = "end", className }: PopoverProps) {
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
          className={cn(
            "absolute z-40 mt-2 min-w-64 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg",
            align === "end" ? "end-0" : "start-0"
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
