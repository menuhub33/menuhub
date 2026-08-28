import { cn } from "@/components/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-center justify-between gap-4 pt-5">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">{value}</p>
          {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
        </div>
        {icon ? (
          <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            {icon}
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
