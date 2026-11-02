"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/core/components/layout/page-header";
import { FormField } from "@/core/components/forms/form-field";
import { Button } from "@/core/ui/button";
import { Input } from "@/core/ui/input";
import { useToast } from "@/core/ui/toast";
import { uploadImageFile } from "@/modules/media/lib/upload-client";
import { paletteFromImageSource } from "@/modules/theming/lib/logo-palette";
import { ThemeCustomizer, type ThemeCustomizerValues } from "@/modules/theming/components/theme-customizer";
import { adminUpdateMall, updateMyMall, updateAdminMallTheme, updateMyMallTheme } from "@/modules/malls/actions/malls";
import type { Mall, MallTheme } from "@/modules/malls/types";

const DEFAULT_THEME: ThemeCustomizerValues = {
  primary_color: "#0f766e",
  secondary_color: "#115e59",
  background_color: "#fafafa",
  text_color: "#18181b",
  font_family: "Expo Arabic",
  custom_css: null,
};

export function MallDesignView({
  mall,
  theme,
  scope,
}: {
  mall: Mall;
  theme: MallTheme | null;
  scope: "mine" | "admin";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<ThemeCustomizerValues>(theme ?? DEFAULT_THEME);
  const [saving, setSaving] = useState(false);
  const [matching, setMatching] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState(mall.logo_url);

  async function save(next: ThemeCustomizerValues) {
    setSaving(true);
    const payload = { ...next, background_color: "#ffffff", theme_id: theme?.theme_id ?? null };
    const result = scope === "mine" ? await updateMyMallTheme(payload) : await updateAdminMallTheme(mall.id, payload);
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
      setValue((current) => ({
        ...current,
        primary_color: palette.primary_color,
        secondary_color: palette.secondary_color,
        text_color: palette.text_color,
      }));
      toast({ title: "تم ضبط الألوان من الشعار", description: "راجع المعاينة ثم اضغط حفظ التخصيص.", variant: "success" });
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
      const uploaded = await uploadImageFile(file, isLogo ? "logos" : "covers");
      if (uploaded.error || !uploaded.data) {
        toast({ title: uploaded.error ?? "تعذر الرفع", variant: "error" });
        return;
      }
      const result =
        scope === "mine"
          ? await updateMyMall({
              name: mall.name,
              slug: mall.slug,
              description: mall.description,
              phone: mall.phone,
              address: mall.address,
              logo_url: kind === "logo_url" ? uploaded.data.url : mall.logo_url,
              cover_image_url: kind === "cover_image_url" ? uploaded.data.url : mall.cover_image_url,
              status: mall.status,
            })
          : await adminUpdateMall({
              id: mall.id,
              name: mall.name,
              slug: mall.slug,
              description: mall.description,
              phone: mall.phone,
              address: mall.address,
              logo_url: kind === "logo_url" ? uploaded.data.url : mall.logo_url,
              cover_image_url: kind === "cover_image_url" ? uploaded.data.url : mall.cover_image_url,
              status: mall.status,
            });
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
        title="تصميم الدليل"
        description="نفس أدوات تصميم المنيو: الشعار، الغلاف، الألوان، والخط."
        actions={
          <Button variant="outline" onClick={() => window.open(`/c/${mall.slug}`, "_blank")}>
            فتح الدليل
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الشعار">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-14 rounded-xl border border-zinc-200 bg-white object-contain" />
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
        </FormField>
        <FormField label="صورة الغلاف">
          <Input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void upload("cover_image_url", file);
            }}
          />
        </FormField>
      </div>
      <div className="flex justify-start">
        <Button type="button" loading={matching} disabled={!logoUrl || matching} onClick={() => void matchLogo()}>
          ألوان متناسقة مع الشعار
        </Button>
      </div>
      <ThemeCustomizer
        value={value}
        onChange={setValue}
        onSave={(next) => void save(next)}
        saving={saving}
        restaurantName={mall.name}
        categoryName="المحلات"
        productName="اسم المحل"
      />
    </div>
  );
}
