import { cn } from "@/components/lib/cn";
import type { RestaurantTheme } from "@/lib/types";

export function ThemePreview({
  theme,
  restaurantName,
  categoryName,
  productName,
  className,
}: {
  theme: Pick<
    RestaurantTheme,
    "primary_color" | "secondary_color" | "background_color" | "text_color" | "font_family"
  >;
  restaurantName?: string;
  categoryName?: string;
  productName?: string;
  className?: string;
}) {
  const title = restaurantName?.trim() || "اسم المطعم";
  const category = categoryName?.trim() || "اسم القسم";
  const product = productName?.trim() || "اسم المنتج";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-100 p-2 shadow-sm",
        className
      )}
    >
      <div
        className="overflow-hidden rounded-[1.35rem]"
        style={{
          backgroundColor: theme.background_color,
          color: theme.text_color,
          fontFamily: theme.font_family ?? "inherit",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 text-[10px]"
          style={{ backgroundColor: theme.primary_color, color: theme.secondary_color }}
        >
          <span>9:41</span>
          <span className="size-8 rounded-full border border-white/30" />
          <span>100%</span>
        </div>
        <div
          className="px-4 py-5"
          style={{ backgroundColor: theme.primary_color, color: theme.secondary_color }}
        >
          <p className="text-[10px] opacity-80">منيو الطعام</p>
          <p className="truncate text-lg font-bold">{title}</p>
        </div>
        <div className="flex gap-2 px-3 py-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-medium"
            style={{ backgroundColor: theme.primary_color, color: theme.secondary_color }}
          >
            {category}
          </span>
        </div>
        <div className="grid gap-2 px-3 pb-4">
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ backgroundColor: theme.secondary_color }}
          >
            <div className="flex items-center gap-2">
              <span
                className="size-8 rounded-lg"
                style={{ backgroundColor: `${theme.primary_color}22` }}
              />
              <span className="text-xs font-medium">{product}</span>
            </div>
            <span className="text-[10px] font-bold" style={{ color: theme.primary_color }}>
              —
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
