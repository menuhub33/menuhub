"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateRestaurantTheme } from "@/modules/theming/actions/theming";
import { createRestaurantTheme } from "@/modules/theming/actions/theming";
import { updateRestaurant } from "@/modules/tenancy/actions/restaurants";
import { uploadImageFile } from "@/modules/media/lib/upload-client";
import { paletteFromImageSource } from "@/modules/theming/lib/logo-palette";
import { PageHeader } from "@/core/components/layout/page-header";
import { ThemeCustomizer, type ThemeCustomizerValues } from "@/modules/theming/components/theme-customizer";
import { FormField } from "@/core/components/forms/form-field";
import { Input } from "@/core/ui/input";
import { Button } from "@/core/ui/button";
import { useToast } from "@/core/ui/toast";
import type { CategoryWithProducts } from "@/modules/catalog/types";
import type { Restaurant } from "@/modules/tenancy/types";
import type { RestaurantTheme } from "@/modules/theming/types";

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
  current,
  categories,
}: {
  restaurant: Restaurant;
  current: RestaurantTheme | null;
  categories: CategoryWithProducts[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<ThemeCustomizerValues>(current ?? DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url);

  async function save(next: ThemeCustomizerValues, themeId?: string | null) {
    setSaving(true);
    const payload = {
      restaurant_id: restaurant.id,
      ...next,
      background_color: "#ffffff",
      theme_id: themeId,
    };
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

  async function matchLogo(source?: File | string) {
    const target = source ?? logoUrl;
    if (!target) {
      toast({ title: "ارفع الشعار أولاً", variant: "error" });
      return;
    }
    setMatching(true);
    try {
      const palette = await paletteFromImageSource(target);
      if (!palette) {
        toast({ title: "لم أجد ألواناً واضحة في الشعار", variant: "error" });
        return;
      }
      setValue((currentTheme) => ({
        ...currentTheme,
        primary_color: palette.primary_color,
        secondary_color: palette.secondary_color,
        text_color: palette.text_color,
      }));
      toast({
        title: "تم ضبط الألوان من الشعار",
        description: "راجع المعاينة ثم اضغط حفظ التخصيص.",
        variant: "success",
      });
    } catch {
      toast({ title: "تعذر قراءة ألوان الشعار", variant: "error" });
    } finally {
      setMatching(false);
    }
  }

  async function upload(kind: "logo_url" | "cover_image_url", file: File) {
    const isLogo = kind === "logo_url";
    if (isLogo) setUploadingLogo(true);
    try {
      const folder = isLogo ? "logos" : "covers";
      const uploaded = await uploadImageFile(file, folder);
      if (uploaded.error || !uploaded.data) {
        toast({ title: uploaded.error ?? "تعذر الرفع", variant: "error" });
        return;
      }
      const result = await updateRestaurant({ id: restaurant.id, [kind]: uploaded.data.url });
      if (result.error) {
        toast({ title: result.error, variant: "error" });
        return;
      }
      if (isLogo) setLogoUrl(uploaded.data.url);
      toast({ title: "تم تحديث الصورة", variant: "success" });
      router.refresh();
      if (isLogo) await matchLogo(file);
    } finally {
      if (isLogo) setUploadingLogo(false);
    }
  }

  return (
    <div className="grid gap-8">
      <PageHeader
        title="التصميم"
        description="عدّل الألوان والخط من الشعار، مع معاينة مباشرة."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "التصميم" }]}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الشعار">
          <div className="grid gap-3">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt=""
                  className="size-14 rounded-xl border border-zinc-200 bg-white object-contain"
                />
              ) : null}
              <Input
                type="file"
                accept="image/*"
                disabled={uploadingLogo}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void upload("logo_url", file);
                }}
              />
            </div>
            {uploadingLogo ? (
              <div className="grid gap-2" role="status" aria-live="polite">
                <p className="text-sm font-medium text-teal-800">جار تحميل الشعار</p>
                <div className="relative h-2 overflow-hidden rounded-full bg-teal-100">
                  <div
                    className="absolute inset-y-0 start-0 w-1/3 rounded-full bg-teal-600"
                    style={{ animation: "logo-load 1.1s ease-in-out infinite" }}
                  />
                </div>
                <style>{`@keyframes logo-load { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }`}</style>
              </div>
            ) : null}
          </div>
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
      <div className="flex justify-start">
        <Button
          type="button"
          loading={matching}
          disabled={!logoUrl || matching}
          onClick={() => void matchLogo()}
        >
          ألوان متناسقة مع الشعار
        </Button>
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
