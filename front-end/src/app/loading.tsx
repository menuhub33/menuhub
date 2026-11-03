import { Skeleton } from "@/core/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Skeleton className="h-10 w-40" />
    </div>
  );
}
