"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { checkSlugAvailable } from "@/actions/reserved-subdomains/checkSlugAvailable";
import { updateRestaurant } from "@/actions/restaurants/updateRestaurant";
import { updateRestaurantTheme } from "@/actions/restaurant-themes/updateRestaurantTheme";
import { createRestaurantTheme } from "@/actions/restaurant-themes/createRestaurantTheme";
import { createCategory } from "@/actions/categories/createCategory";
import { createProduct } from "@/actions/products/createProduct";
import { updateMenuStatus } from "@/actions/menus/updateMenuStatus";
import { uploadImageFile } from "@/lib/upload-client";
import { isValidSlug, publicMenuHost, slugifyName } from "@/lib/config";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ThemeGallery } from "@/components/themes/theme-gallery";
import type { Menu, Restaurant, Theme } from "@/lib/types";

export function OnboardingWizard({
  restaurant,
  menu,
  themes,
  canOpenDashboard = false,
}: {
  restaurant: Restaurant;
  menu: Menu | null;
  themes: Theme[];
  canOpenDashboard?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(restaurant.name);
  const [description, setDescription] = useState(restaurant.description ?? "");
  const [slug, setSlug] = useState(restaurant.slug || slugifyName(restaurant.name));
  const [slugState, setSlugState] = useState<"idle" | "checking" | "ok" | "taken" | "invalid">("idle");
  const [themeId, setThemeId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState("البرغر");
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = useMemo(
    () => ["المطعم", "الرابط", "التصميم", "الشعار", "القسم", "المنتج", "النشر"],
    []
  );

  async function checkSlug(value: string) {
    const next = value.trim().toLowerCase();
    setSlug(next);
    if (!isValidSlug(next)) {
      setSlugState("invalid");
      return;
    }
    setSlugState("checking");
    const result = await checkSlugAvailable(next);
    if (result.data?.available || next === restaurant.slug) setSlugState("ok");
    else setSlugState("taken");
  }

  async function next() {
    setError("");
    setLoading(true);
    try {
      if (step === 1) {
        const result = await updateRestaurant({ id: restaurant.id, name, description });
        if (result.error) throw new Error(result.error);
      }
      if (step === 2) {
        if (!isValidSlug(slug)) throw new Error("صيغة الرابط غير صحيحة");
        const availability = await checkSlugAvailable(slug);
        if (!availability.data?.available && slug !== restaurant.slug) {
          throw new Error("هذا الرابط مستخدم أو محجوز");
        }
        const result = await updateRestaurant({ id: restaurant.id, slug });
        if (result.error) throw new Error(result.error);
      }
      if (step === 3 && themeId) {
        const result = await updateRestaurantTheme({ restaurant_id: restaurant.id, theme_id: themeId });
        if (result.error) {
          const created = await createRestaurantTheme({ restaurant_id: restaurant.id, theme_id: themeId });
          if (created.error) throw new Error(created.error);
        }
      }
      if (step === 5) {
        if (!menu) throw new Error("لا توجد قائمة افتراضية");
        const result = await createCategory({ menu_id: menu.id, name_ar: categoryName || "البرغر" });
        if (result.error || !result.data) throw new Error(result.error ?? "تعذر إنشاء القسم");
        sessionStorage.setItem("mh-first-category", result.data.id);
      }
      if (step === 6) {
        const categoryId = sessionStorage.getItem("mh-first-category");
        if (!categoryId) throw new Error("أنشئ قسماً أولاً");
        const price = Number(productPrice);
        if (!productName.trim() || Number.isNaN(price)) throw new Error("أدخل اسم المنتج وسعراً صالحاً");
        const result = await createProduct({
          category_id: categoryId,
          name_ar: productName,
          price,
        });
        if (result.error) throw new Error(result.error);
      }
      if (step === 7) {
        if (!menu) throw new Error("لا توجد قائمة");
        const [menuResult, restaurantResult] = await Promise.all([
          updateMenuStatus(menu.id, restaurant.id, "PUBLISHED"),
          updateRestaurant({ id: restaurant.id, menu_status: "PUBLISHED" }),
        ]);
        if (menuResult.error || restaurantResult.error) {
          throw new Error(menuResult.error ?? restaurantResult.error ?? "تعذر النشر");
        }
        router.push("/onboarding/completed");
        return;
      }
      setStep((current) => current + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="mb-2 text-center text-sm font-medium text-teal-700">MenuHub</p>
      <h1 className="mb-6 text-center text-2xl font-bold">إعداد مطعمك</h1>
      {canOpenDashboard ? (
        <p className="-mt-4 mb-6 text-center text-sm">
          <Link href="/dashboard" className="text-teal-700 hover:underline">
            تخطي إلى لوحة التحكم
          </Link>
        </p>
      ) : null}
      <div className="mb-8 flex gap-1">
        {steps.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={`h-1.5 rounded-full ${index + 1 <= step ? "bg-teal-700" : "bg-zinc-200"}`} />
            <p className="mt-2 hidden text-center text-[11px] text-zinc-500 sm:block">{label}</p>
          </div>
        ))}
      </div>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6">
        {step === 1 ? (
          <div className="grid gap-4">
            <FormField label="اسم المطعم" htmlFor="name" required>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
            </FormField>
            <FormField label="وصف المطعم" htmlFor="description">
              <Textarea id="description" value={description} onChange={(event) => setDescription(event.target.value)} />
            </FormField>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="grid gap-3">
            <FormField
              label="رابط المنيو"
              htmlFor="slug"
              required
              error={
                slugState === "invalid"
                  ? "أحرف إنجليزية صغيرة وأرقام وشرطات فقط"
                  : slugState === "taken"
                    ? "هذا الرابط مستخدم أو محجوز"
                    : undefined
              }
            >
              <Input
                id="slug"
                dir="ltr"
                value={slug}
                onChange={(event) => void checkSlug(event.target.value)}
              />
            </FormField>
            <p className="text-sm text-zinc-500" dir="ltr">
              {publicMenuHost(slug || "your-restaurant")}
            </p>
            {slugState === "ok" ? <Alert variant="success">الرابط متاح</Alert> : null}
          </div>
        ) : null}
        {step === 3 ? (
          <ThemeGallery
            themes={themes}
            selectedThemeId={themeId}
            onSelect={(theme) => setThemeId(theme.id)}
          />
        ) : null}
        {step === 4 ? (
          <FormField label="رفع الشعار">
            <Input
              type="file"
              accept="image/*"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const uploaded = await uploadImageFile(
                  file,
                  `restaurants/${restaurant.id}`
                );
                if (uploaded.error || !uploaded.data) {
                  setError(uploaded.error ?? "تعذر رفع الشعار");
                  return;
                }
                await updateRestaurant({ id: restaurant.id, logo_url: uploaded.data.url });
              }}
            />
          </FormField>
        ) : null}
        {step === 5 ? (
          <FormField label="اسم أول قسم" htmlFor="category" hint="مثال: البرغر">
            <Input id="category" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} />
          </FormField>
        ) : null}
        {step === 6 ? (
          <div className="grid gap-4">
            <FormField label="اسم المنتج" htmlFor="product" required>
              <Input id="product" value={productName} onChange={(event) => setProductName(event.target.value)} />
            </FormField>
            <FormField label="السعر" htmlFor="price" required>
              <Input id="price" type="number" min={0} value={productPrice} onChange={(event) => setProductPrice(event.target.value)} />
            </FormField>
          </div>
        ) : null}
        {step === 7 ? (
          <p className="text-sm leading-7 text-zinc-600">
            جاهز للنشر؟ سيظهر المنيو للزبائن على الرابط الخاص بمطعمك. يمكنك تعديل كل شيء لاحقاً من لوحة التحكم.
          </p>
        ) : null}
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="outline" disabled={step === 1 || loading} onClick={() => setStep((current) => current - 1)}>
            السابق
          </Button>
          <Button loading={loading} onClick={() => void next()}>
            {step === 7 ? "نشر المنيو" : "التالي"}
          </Button>
        </div>
      </div>
    </div>
  );
}
