"use client";

import { useEffect } from "react";
import { cn } from "@/components/lib/cn";
import { XIcon } from "@/components/ui/icons";

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
  side?: "start" | "end";
  className?: string;
};

export function Drawer({
  open,
  onOpenChange,
  title,
  children,
  side = "start",
  className,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <button
        type="button"
        aria-label="إغلاق القائمة"
        onClick={() => onOpenChange(false)}
        className={cn(
          "absolute inset-0 bg-zinc-950/40 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <aside
        className={cn(
          "absolute top-0 flex h-full w-[min(20rem,90vw)] flex-col bg-white shadow-xl transition-transform",
          side === "start" ? "start-0" : "end-0",
          open
            ? "translate-x-0"
            : side === "start"
              ? "ltr:-translate-x-full rtl:translate-x-full"
              : "ltr:translate-x-full rtl:-translate-x-full",
          className
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="إغلاق"
          >
            <XIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{children}</div>
      </aside>
    </div>
  );
}
