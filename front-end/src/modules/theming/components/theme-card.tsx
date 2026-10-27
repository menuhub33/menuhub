"use client";

import { cn } from "@/core/lib/cn";
import { Badge } from "@/core/ui/badge";
import { ContentImage } from "@/core/ui/content-image";
import { CheckIcon, PaletteIcon } from "@/core/ui/icons";
import type { Theme } from "@/modules/theming/types";

export function ThemeCard({
  theme,
  selected = false,
  onSelect,
  className,
}: {
  theme: Theme;
  selected?: boolean;
  onSelect?: (theme: Theme) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(theme)}
      aria-pressed={selected}
      className={cn(
        "overflow-hidden rounded-2xl border border-zinc-200 bg-white text-start shadow-sm transition",
        "hover:border-teal-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-700/20",
        selected && "border-teal-700 ring-2 ring-teal-700 ring-offset-2",
        className
      )}
    >
      <div className="relative h-36 bg-zinc-100">
        {theme.preview_image_url ? (
          <ContentImage
            src={theme.preview_image_url}
            alt=""
            sizes="(max-width: 640px) 100vw, 360px"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-teal-50 text-teal-700">
            <PaletteIcon className="size-10" />
          </div>
        )}
        {theme.is_premium ? (
          <Badge variant="warning" className="absolute start-3 top-3">
            مميز
          </Badge>
        ) : null}
        {selected ? (
          <span className="absolute end-3 top-3 flex size-8 items-center justify-center rounded-full bg-teal-700 text-white shadow">
            <CheckIcon className="size-4" />
          </span>
        ) : null}
      </div>
      <div className="px-4 py-3">
        <p className="font-semibold text-zinc-900">{theme.name}</p>
      </div>
    </button>
  );
}
