import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
