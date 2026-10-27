import { cn } from "@/core/lib/cn";
import { Spinner } from "@/core/ui/spinner";

export function LoadingState({
  label = "جارٍ التحميل...",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-40 items-center justify-center", className)}>
      <Spinner label={label} />
    </div>
  );
}
