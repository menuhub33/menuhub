import { cn } from "@/components/lib/cn";

export function Spinner({
  className,
  label = "جارٍ التحميل",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-zinc-500", className)}>
      <span className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-teal-700" />
      <span>{label}</span>
    </span>
  );
}
