import { cn } from "@/components/lib/cn";

export function SectionHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
