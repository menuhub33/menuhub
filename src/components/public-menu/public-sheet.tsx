"use client";

import { useEffect } from "react";
import { cn } from "@/components/lib/cn";
import { XIcon } from "@/components/ui/icons";
import type { ComponentType, ReactNode, SVGProps } from "react";

export function PublicSheet({
  open,
  onOpenChange,
  title,
  icon: Icon,
  children,
  footer,
  size = "md",
  hideHeader = false,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  hideHeader?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="إغلاق"
        className="absolute inset-0 bg-zinc-950/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "public-sheet-title" : undefined}
        className={cn(
          "relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white text-[var(--mh-text)] shadow-2xl sm:rounded-2xl",
          widths[size],
          className
        )}
        dir="rtl"
      >
        {hideHeader ? null : (
          <div className="flex items-center justify-between bg-[var(--mh-primary)] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {Icon ? <Icon className="size-5" /> : null}
              <h2 id="public-sheet-title" className="text-base font-bold">
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1 text-white/90 hover:bg-white/15"
              aria-label="إغلاق"
            >
              <XIcon className="size-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? <div className="shrink-0 border-t border-zinc-100 px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}
