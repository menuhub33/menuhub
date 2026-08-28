"use client";

import { cn } from "@/components/lib/cn";

export type TooltipProps = {
  content: string;
  children: React.ReactNode;
  className?: string;
};

export function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn("relative inline-flex group/tooltip", className)}>
      {children}
      <span className="pointer-events-none absolute bottom-full start-1/2 z-40 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 shadow transition group-hover/tooltip:opacity-100 rtl:translate-x-1/2">
        {content}
      </span>
    </span>
  );
}
