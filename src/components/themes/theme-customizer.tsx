"use client";

import { cn } from "@/components/lib/cn";
import { FormField } from "@/components/forms/form-field";
import { ColorPicker } from "@/components/themes/color-picker";
import { FontSelector } from "@/components/themes/font-selector";
import { LiveMenuPreview } from "@/components/themes/live-menu-preview";
import type { CategoryWithProducts } from "@/components/lib/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { RestaurantTheme } from "@/lib/types";

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
          <ColorPicker
            label="لون الخلفية"
            value={value.background_color}
            onChange={(background_color) => patch({ background_color })}
          />
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
        <FormField
          label="CSS مخصص"
          htmlFor="theme-custom-css"
          hint="يُطبَّق على معاينة المنيو فقط ضمن هذه البطاقة."
        >
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
