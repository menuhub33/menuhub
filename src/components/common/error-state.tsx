import { cn } from "@/components/lib/cn";
import { Button } from "@/components/ui/button";
import { AlertCircleIcon, RefreshIcon } from "@/components/ui/icons";

export function ErrorState({
  title = "حدث خطأ",
  description = "تعذر تحميل البيانات. حاول مرة أخرى.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-40 flex-col items-center justify-center gap-3 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircleIcon />
      </span>
      <div>
        <p className="font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshIcon className="size-4" />
          إعادة المحاولة
        </Button>
      ) : null}
    </div>
  );
}
