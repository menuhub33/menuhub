"use client";

import { cn } from "@/core/lib/cn";
import { FormField } from "@/core/components/forms/form-field";
import { ColorPicker } from "@/modules/theming/components/color-picker";
import { FontSelector } from "@/modules/theming/components/font-selector";
import { LiveMenuPreview } from "@/modules/theming/components/live-menu-preview";
import type { CategoryWithProducts } from "@/modules/catalog/types";
import { Alert } from "@/core/ui/alert";
import { Button } from "@/core/ui/button";
import { Textarea } from "@/core/ui/textarea";
import type { RestaurantTheme } from "@/modules/theming/types";

export type ThemeCustomizerValues = Pick<
  RestaurantTheme,
  | "primary_color"
  | "secondary_color"
  | "background_color"
  | "text_color"
  | "font_family"
  | "custom_css"
>;

export function ThemeCustomizer({
  value,
  onChange,
  onSave,
  saving,
  error,
  restaurantName,
  categoryName,
  productName,
  productPrice,
  currency,
  categories,
  className,
}: {
  value: ThemeCustomizerValues;
  onChange: (value: ThemeCustomizerValues) => void;
  onSave?: (value: ThemeCustomizerValues) => void;
  saving?: boolean;
  error?: string | null;
  restaurantName?: string;
  categoryName?: string;
  productName?: string;
  productPrice?: number;
  currency?: string;
  categories?: CategoryWithProducts[];
  className?: string;
}) {
  function patch(partial: Partial<ThemeCustomizerValues>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className={cn("grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]", className)}>
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSave?.(value);
        }}
      >
        {error ? <Alert variant="error">{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorPicker
            label="اللون الأساسي"
            value={value.primary_color}
            onChange={(primary_color) => patch({ primary_color })}
          />
          <ColorPicker
            label="اللون الثانوي"
            value={value.secondary_color}
            onChange={(secondary_color) => patch({ secondary_color })}
          />
          <FormField label="لون الخلفية">
            <p className="flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 text-sm text-zinc-600">
              <span className="size-5 rounded-md border border-zinc-200 bg-white/90" />
              أبيض شفاف
            </p>
          </FormField>
          <ColorPicker
            label="لون النص"
            value={value.text_color}
            onChange={(text_color) => patch({ text_color })}
          />
        </div>
        <FontSelector
          value={value.font_family}
          onChange={(font_family) => patch({ font_family })}
        />
        <FormField label="CSS مخصص" htmlFor="theme-custom-css">
          <Textarea
            id="theme-custom-css"
            dir="ltr"
            rows={6}
            value={value.custom_css ?? ""}
            placeholder=".mh-live-preview { }"
            onChange={(event) => patch({ custom_css: event.target.value || null })}
            className="font-mono text-xs"
          />
        </FormField>
        {onSave ? (
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              حفظ التخصيص
            </Button>
          </div>
        ) : null}
      </form>
      <div className="lg:sticky lg:top-4 lg:self-start">
        <p className="mb-2 text-sm font-medium text-zinc-700">معاينة حية</p>
        <LiveMenuPreview
          theme={value}
          restaurantName={restaurantName}
          categoryName={categoryName}
          productName={productName}
          productPrice={productPrice}
          currency={currency}
          categories={categories}
        />
      </div>
    </div>
  );
}
