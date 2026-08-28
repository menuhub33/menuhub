import { cn } from "@/components/lib/cn";
import { InboxIcon } from "@/components/ui/icons";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-48 flex-col items-center justify-center gap-3 px-4 text-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500">
        {icon ?? <InboxIcon className="size-7" />}
      </span>
      <div>
        <p className="text-base font-semibold text-zinc-900">{title}</p>
        {description ? <p className="mt-1 max-w-md text-sm text-zinc-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
