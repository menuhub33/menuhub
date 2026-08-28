import { cn } from "@/components/lib/cn";
import { Spinner } from "@/components/ui/spinner";

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
