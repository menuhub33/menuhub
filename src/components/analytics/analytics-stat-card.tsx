import { cn } from "@/components/lib/cn";
import { Card, CardContent } from "@/components/ui/card";

function formatCount(value: number): string {
  return new Intl.NumberFormat("ar").format(value);
}

export function AnalyticsStatCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="pt-5">
        <p className="text-sm text-zinc-500">{label}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">
          {typeof value === "number" ? formatCount(value) : value}
        </p>
        {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
