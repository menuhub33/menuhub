import { Skeleton } from "@/components/ui/skeleton";

export function MenuLoading() {
  return (
    <div dir="rtl" lang="ar" className="min-h-dvh bg-zinc-100" aria-busy aria-label="جارٍ تحميل المنيو">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-28">
        <Skeleton className="h-48 w-full rounded-[1.75rem] sm:h-56" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-14 flex-1 rounded-2xl" />
          <Skeleton className="size-14 rounded-2xl" />
        </div>
        <div className="mt-5 flex gap-3 overflow-hidden">
          <Skeleton className="size-[5.75rem] shrink-0 rounded-2xl" />
          <Skeleton className="size-[5.75rem] shrink-0 rounded-2xl" />
          <Skeleton className="size-[5.75rem] shrink-0 rounded-2xl" />
          <Skeleton className="size-[5.75rem] shrink-0 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 mb-4 h-6 w-36" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl bg-white p-0 shadow-sm">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="mx-auto h-4 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
