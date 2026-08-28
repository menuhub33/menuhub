import Link from "next/link";
import { cn } from "@/components/lib/cn";
import type { BreadcrumbItem } from "@/components/lib/types";

export function DashboardBreadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <nav aria-label="مسار الصفحة" className={cn("flex flex-wrap items-center gap-1 text-sm text-zinc-500", className)}>
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? <span className="text-zinc-300">/</span> : null}
            {item.href && !last ? (
              <Link href={item.href} className="hover:text-zinc-800">
                {item.label}
              </Link>
            ) : (
              <span className={last ? "font-medium text-zinc-800" : undefined}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
