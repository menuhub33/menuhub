"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRestaurantTheme } from "@/actions/restaurant-themes/updateRestaurantTheme";
import { createRestaurantTheme } from "@/actions/restaurant-themes/createRestaurantTheme";
import { updateRestaurant } from "@/actions/restaurants/updateRestaurant";
import { uploadImageFile } from "@/lib/upload-client";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeGallery } from "@/components/themes/theme-gallery";
import { ThemeCustomizer, type ThemeCustomizerValues } from "@/components/themes/theme-customizer";
import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { CategoryWithProducts } from "@/components/lib/types";
import type { Restaurant, RestaurantTheme, Theme } from "@/lib/types";

const DEFAULT_THEME: ThemeCustomizerValues = {
  primary_color: "#0f766e",
  secondary_color: "#115e59",
  background_color: "#fafafa",
  text_color: "#18181b",
  font_family: "Expo Arabic",
  custom_css: null,
};

export function DesignView({
  restaurant,
  themes,
  current,
  categories,
}: {
  restaurant: Restaurant;
  themes: Theme[];
  current: RestaurantTheme | null;
  categories: CategoryWithProducts[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<ThemeCustomizerValues>(current ?? DEFAULT_THEME);
  const [saving, setSaving] = useState(false);

  async function save(next: ThemeCustomizerValues, themeId?: string | null) {
    setSaving(true);
    const payload = { restaurant_id: restaurant.id, ...next, theme_id: themeId };
    const result = current
      ? await updateRestaurantTheme(payload)
      : await createRestaurantTheme(payload);
    setSaving(false);
    if (result.error) toast({ title: result.error, variant: "error" });
    else {
      toast({ title: "تم حفظ التصميم", variant: "success" });
      router.refresh();
    }
  }

  async function upload(kind: "logo_url" | "cover_image_url", file: File) {
    const uploaded = await uploadImageFile(file, `restaurants/${restaurant.id}`);
    if (uploaded.error || !uploaded.data) {
      toast({ title: uploaded.error ?? "تعذر الرفع", variant: "error" });
      return;
    }
    const result = await updateRestaurant({ id: restaurant.id, [kind]: uploaded.data.url });
    if (result.error) toast({ title: result.error, variant: "error" });
    else {
      toast({ title: "تم تحديث الصورة", variant: "success" });
      router.refresh();
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        title="التصميم"
        description="اختر ثيماً وعدّل الألوان والخطوط مع معاينة مباشرة."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "التصميم" }]}
      />
      <ThemeGallery
        themes={themes}
        selectedThemeId={current?.theme_id}
        onSelect={(theme) => void save(value, theme.id)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الشعار">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload("logo_url", file);
            }}
          />
        </FormField>
        <FormField label="صورة الغلاف">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload("cover_image_url", file);
            }}
          />
        </FormField>
      </div>
      <ThemeCustomizer
        value={value}
        onChange={setValue}
        onSave={(next) => void save(next, current?.theme_id)}
        saving={saving}
        restaurantName={restaurant.name}
        categories={categories}
        currency={restaurant.currency}
      />
      <Button variant="outline" onClick={() => window.open(`/m/${restaurant.slug}`, "_blank")}>
        فتح المنيو العامة
      </Button>
    </div>
  );
}
