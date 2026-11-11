import { cn } from "@/core/lib/cn";
import { Skeleton } from "@/core/ui/skeleton";
import { menuGridClass, menuShellClass } from "@/modules/storefront/lib/menu-layout";

function shownFrom(index: number) {
  if (index > 7) return "hidden xl:block";
  if (index > 5) return "hidden lg:block";
  if (index > 3) return "hidden sm:block";
  return undefined;
}

export function MenuLoading() {
  return (
    <div dir="rtl" lang="ar" className="min-h-dvh bg-zinc-100" aria-busy aria-label="جارٍ تحميل المنيو">
      <div className={menuShellClass}>
        <Skeleton className="h-40 w-full rounded-[1.75rem] min-[380px]:h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80" />
        <div className="mt-4 flex gap-2 min-[380px]:gap-3">
          <Skeleton className="h-12 flex-1 rounded-2xl min-[380px]:h-14" />
          <Skeleton className="size-12 rounded-2xl min-[380px]:size-14" />
        </div>
        <div className="mt-5 flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "size-[5.25rem] shrink-0 rounded-2xl min-[380px]:size-24 sm:size-[6.75rem] lg:size-32",
                shownFrom(index)
              )}
            />
          ))}
        </div>
        <Skeleton className="mt-6 mb-4 h-6 w-36" />
        <div className={menuGridClass}>
          {Array.from({ length: 10 }, (_, index) => (
            <div
              key={index}
              className={cn("overflow-hidden rounded-2xl bg-white p-0 shadow-sm", shownFrom(index))}
            >
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
