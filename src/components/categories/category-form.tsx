"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { CategoryImageUpload } from "@/components/categories/category-image-upload";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/types";

export type CategoryFormValues = {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: CategoryFormValues = {
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  image_url: null,
  is_active: true,
  sort_order: 0,
};

function fromCategory(category?: Category | null): CategoryFormValues {
  if (!category) return EMPTY;
  return {
    name_ar: category.name_ar,
    name_en: category.name_en ?? "",
    description_ar: category.description_ar ?? "",
    description_en: category.description_en ?? "",
    image_url: category.image_url,
    is_active: category.is_active,
    sort_order: category.sort_order,
  };
}

export function CategoryForm({
  category,
  loading,
  error,
  onSubmit,
  onCancel,
  onUpload,
  submitLabel,
}: {
  category?: Category | null;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: CategoryFormValues) => void | Promise<void>;
  onCancel?: () => void;
  onUpload?: (file: File) => Promise<string>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<CategoryFormValues>(() => fromCategory(category));
  const [nameError, setNameError] = useState<string | undefined>();

  function update<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const nameAr = values.name_ar.trim();
        if (!nameAr) {
          setNameError("الاسم العربي مطلوب");
          return;
        }
        setNameError(undefined);
        void onSubmit({
          ...values,
          name_ar: nameAr,
          name_en: values.name_en.trim(),
          description_ar: values.description_ar.trim(),
          description_en: values.description_en.trim(),
        });
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <CategoryImageUpload
        value={values.image_url}
        onUploaded={(url) => update("image_url", url)}
        onUpload={onUpload}
        disabled={loading}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الاسم بالعربي" htmlFor="name_ar" required error={nameError}>
          <Input
            id="name_ar"
            value={values.name_ar}
            maxLength={150}
            required
            invalid={Boolean(nameError)}
            onChange={(event) => {
              update("name_ar", event.target.value);
              if (nameError) setNameError(undefined);
            }}
          />
        </FormField>
        <FormField label="الاسم بالإنجليزية" htmlFor="name_en">
          <Input
            id="name_en"
            dir="ltr"
            value={values.name_en}
            maxLength={150}
            onChange={(event) => update("name_en", event.target.value)}
          />
        </FormField>
      </div>
      <FormField label="الوصف بالعربي" htmlFor="description_ar">
        <Textarea
          id="description_ar"
          value={values.description_ar}
          onChange={(event) => update("description_ar", event.target.value)}
        />
      </FormField>
      <FormField label="الوصف بالإنجليزية" htmlFor="description_en">
        <Textarea
          id="description_en"
          dir="ltr"
          value={values.description_en}
          onChange={(event) => update("description_en", event.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="ترتيب العرض" htmlFor="sort_order" hint="الأرقام الأصغر تظهر أولًا">
          <Input
            id="sort_order"
            type="number"
            dir="ltr"
            min={0}
            value={values.sort_order}
            onChange={(event) => update("sort_order", Number(event.target.value) || 0)}
          />
        </FormField>
        <FormField label="حالة القسم">
          <Switch
            checked={values.is_active}
            onCheckedChange={(checked) => update("is_active", checked)}
            label={values.is_active ? "ظاهر في المنيو" : "مخفي من المنيو"}
          />
        </FormField>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
            إلغاء
          </Button>
        ) : null}
        <Button type="submit" loading={loading}>
          {submitLabel ?? (category ? "حفظ التعديلات" : "إنشاء القسم")}
        </Button>
      </div>
    </form>
  );
}
