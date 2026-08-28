import { cn } from "@/components/lib/cn";
import { DashboardBreadcrumbs } from "@/components/layout/dashboard-breadcrumbs";
import type { BreadcrumbItem } from "@/components/lib/types";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div className="min-w-0">
        {breadcrumbs?.length ? <DashboardBreadcrumbs items={breadcrumbs} className="mb-2" /> : null}
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
