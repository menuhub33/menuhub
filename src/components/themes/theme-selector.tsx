"use client";

import { cn } from "@/components/lib/cn";
import { ThemeGallery } from "@/components/themes/theme-gallery";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, PaletteIcon } from "@/components/ui/icons";
import type { Theme } from "@/lib/types";

export function ThemeSelector({
  themes,
  selectedThemeId,
  onSelect,
  loading,
  error,
  onRetry,
  query,
  onQueryChange,
  className,
}: {
  themes: Theme[];
  selectedThemeId?: string | null;
  onSelect: (themeId: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  className?: string;
}) {
  const selected = themes.find((theme) => theme.id === selectedThemeId);

  return (
    <div className={cn("grid gap-5", className)}>
      <div className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          {selected ? <CheckIcon className="size-5" /> : <PaletteIcon className="size-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">الثيم المحدد</p>
          {selected ? (
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="font-semibold text-zinc-900">{selected.name}</p>
              {selected.is_premium ? <Badge variant="warning">مميز</Badge> : null}
            </div>
          ) : (
            <p className="mt-0.5 font-medium text-zinc-700">لم يتم اختيار ثيم بعد</p>
          )}
        </div>
      </div>
      <ThemeGallery
        themes={themes}
        selectedThemeId={selectedThemeId}
        onSelect={(theme) => onSelect(theme.id)}
        loading={loading}
        error={error}
        onRetry={onRetry}
        query={query}
        onQueryChange={onQueryChange}
      />
    </div>
  );
}
