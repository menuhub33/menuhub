"use client";

import { useMemo, useState } from "react";
import { cn } from "@/components/lib/cn";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LoadingState } from "@/components/common/loading-state";
import { SearchInput } from "@/components/common/search-input";
import { ThemeCard } from "@/components/themes/theme-card";
import { PaletteIcon } from "@/components/ui/icons";
import type { Theme } from "@/lib/types";

export function ThemeGallery({
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
  onSelect: (theme: Theme) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  query?: string;
  onQueryChange?: (query: string) => void;
  className?: string;
}) {
  const [internalQuery, setInternalQuery] = useState("");
  const search = query ?? internalQuery;

  function handleSearch(next: string) {
    if (onQueryChange) onQueryChange(next);
    else setInternalQuery(next);
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return themes;
    return themes.filter((theme) => {
      const haystack = `${theme.name} ${theme.description ?? ""} ${theme.slug}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [themes, search]);

  if (loading) return <LoadingState label="جارٍ تحميل الثيمات..." />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  return (
    <div className={cn("grid gap-4", className)}>
      <SearchInput
        value={search}
        onChange={handleSearch}
        placeholder="ابحث عن ثيم..."
      />
      {themes.length === 0 ? (
        <EmptyState
          title="لا توجد ثيمات"
          description="ستظهر هنا الثيمات المتاحة لتخصيص المنيو."
          icon={<PaletteIcon className="size-7" />}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="لا توجد نتائج"
          description="جرّب كلمة بحث مختلفة."
          icon={<PaletteIcon className="size-7" />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={theme.id === selectedThemeId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
