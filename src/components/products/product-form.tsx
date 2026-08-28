"use client";

import { useMemo, useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { PRODUCT_STATUS_LABELS } from "@/components/lib/labels";
import type { OptionGroupWithOptions, ProductWithRelations } from "@/components/lib/types";
import { ProductGallery, type ProductGalleryItem } from "@/components/products/product-gallery";
import { ProductPrice } from "@/components/products/product-price";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, PencilIcon, PlusIcon, StarIcon } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category, ProductStatus } from "@/lib/types";

export type ProductFormValues = {
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  old_price: number | null;
  currency: string;
  category_id: string;
  status: ProductStatus;
  is_featured: boolean;
  sort_order: number;
  images: ProductGalleryItem[];
};

type Draft = {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: string;
  old_price: string;
  currency: string;
  category_id: string;
  status: ProductStatus;
  is_featured: boolean;
  sort_order: string;
  images: ProductGalleryItem[];
};

type FieldKey = "name_ar" | "price" | "category_id" | "old_price" | "sort_order";

const CURRENCY_OPTIONS = [
  { value: "SYP", label: "ليرة سورية" },
  { value: "USD", label: "دولار" },
  { value: "TRY", label: "ليرة تركية" },
  { value: "SAR", label: "ريال سعودي" },
];

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "AVAILABLE", label: PRODUCT_STATUS_LABELS.AVAILABLE },
  { value: "UNAVAILABLE", label: PRODUCT_STATUS_LABELS.UNAVAILABLE },
  { value: "HIDDEN", label: PRODUCT_STATUS_LABELS.HIDDEN },
];

function emptyDraft(currency: string, categoryId: string): Draft {
  return {
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    price: "",
    old_price: "",
    currency,
    category_id: categoryId,
    status: "AVAILABLE",
    is_featured: false,
    sort_order: "0",
    images: [],
  };
}

function fromProduct(
  product: ProductWithRelations | null | undefined,
  defaultCurrency: string,
  defaultCategoryId: string
): Draft {
  if (!product) return emptyDraft(defaultCurrency, defaultCategoryId);
  return {
    name_ar: product.name_ar,
    name_en: product.name_en ?? "",
    description_ar: product.description_ar ?? "",
    description_en: product.description_en ?? "",
    price: String(product.price),
    old_price: product.old_price != null ? String(product.old_price) : "",
    currency: product.currency,
    category_id: product.category_id,
    status: product.status,
    is_featured: product.is_featured,
    sort_order: String(product.sort_order),
    images: (product.images ?? []).map((image) => ({
      id: image.id,
      image_url: image.image_url,
      sort_order: image.sort_order,
      is_primary: image.is_primary,
    })),
  };
}

function parseAmount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function ProductForm({
  product,
  categories,
  optionGroups,
  defaultCurrency = "SYP",
  defaultCategoryId,
  loading,
  error,
  onSubmit,
  onCancel,
  onUploadImage,
  onAddGroup,
  onEditGroup,
}: {
  product?: ProductWithRelations | null;
  categories: Category[];
  optionGroups?: OptionGroupWithOptions[];
  defaultCurrency?: string;
  defaultCategoryId?: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: ProductFormValues) => void | Promise<void>;
  onCancel?: () => void;
  onUploadImage?: (file: File) => Promise<string>;
  onAddGroup?: () => void;
  onEditGroup?: (group: OptionGroupWithOptions) => void;
}) {
  const initialCategory = defaultCategoryId ?? categories[0]?.id ?? "";
  const [values, setValues] = useState<Draft>(() =>
    fromProduct(product, defaultCurrency, initialCategory)
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const groups = optionGroups ?? product?.option_groups ?? [];
  const primaryImage = useMemo(
    () => values.images.find((image) => image.is_primary) ?? values.images[0],
    [values.images]
  );
  const previewPrice = Number(values.price);
  const previewOldPrice = parseAmount(values.old_price);

  function isFieldKey(key: keyof Draft): key is FieldKey {
    return (
      key === "name_ar" ||
      key === "price" ||
      key === "category_id" ||
      key === "old_price" ||
      key === "sort_order"
    );
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (isFieldKey(key)) {
      setFieldErrors((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  }

  function validate(): ProductFormValues | null {
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    const nameAr = values.name_ar.trim();
    if (!nameAr) nextErrors.name_ar = "الاسم بالعربية مطلوب";
    else if (nameAr.length > 200) nextErrors.name_ar = "الاسم يجب ألا يتجاوز 200 حرف";

    if (!values.category_id) nextErrors.category_id = "التصنيف مطلوب";

    const price = parseAmount(values.price);
    if (price == null) nextErrors.price = "السعر مطلوب";
    else if (Number.isNaN(price) || price < 0) nextErrors.price = "أدخل سعرًا صالحًا (0 أو أكثر)";

    let oldPrice: number | null = null;
    if (values.old_price.trim()) {
      const parsed = parseAmount(values.old_price);
      if (parsed == null || Number.isNaN(parsed) || parsed < 0) {
        nextErrors.old_price = "السعر السابق غير صالح";
      } else {
        oldPrice = parsed;
      }
    }

    const sortOrder = Number.parseInt(values.sort_order || "0", 10);
    if (!Number.isFinite(sortOrder)) nextErrors.sort_order = "ترتيب العرض يجب أن يكون رقمًا";

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || price == null || Number.isNaN(price)) return null;

    return {
      name_ar: nameAr,
      name_en: toNullableText(values.name_en),
      description_ar: toNullableText(values.description_ar),
      description_en: toNullableText(values.description_en),
      price,
      old_price: oldPrice,
      currency: values.currency,
      category_id: values.category_id,
      status: values.status,
      is_featured: values.is_featured,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
      images: values.images,
    };
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = validate();
        if (parsed) void onSubmit(parsed);
      }}
    >
      <div className="grid gap-5">
        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم بالعربية" htmlFor="name_ar" required error={fieldErrors.name_ar}>
            <Input
              id="name_ar"
              value={values.name_ar}
              maxLength={200}
              invalid={Boolean(fieldErrors.name_ar)}
              onChange={(event) => update("name_ar", event.target.value)}
              required
            />
          </FormField>
          <FormField label="الاسم بالإنجليزية" htmlFor="name_en">
            <Input
              id="name_en"
              dir="ltr"
              value={values.name_en}
              maxLength={200}
              onChange={(event) => update("name_en", event.target.value)}
            />
          </FormField>
        </div>

        <FormField label="الوصف بالعربية" htmlFor="description_ar">
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

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="السعر" htmlFor="price" required error={fieldErrors.price}>
            <Input
              id="price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={values.price}
              invalid={Boolean(fieldErrors.price)}
              onChange={(event) => update("price", event.target.value)}
              required
            />
          </FormField>
          <FormField
            label="السعر السابق"
            htmlFor="old_price"
            hint="يظهر مشطوبًا عند وجود خصم"
            error={fieldErrors.old_price}
          >
            <Input
              id="old_price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={values.old_price}
              invalid={Boolean(fieldErrors.old_price)}
              onChange={(event) => update("old_price", event.target.value)}
            />
          </FormField>
          <FormField label="العملة" htmlFor="currency">
            <Select
              id="currency"
              value={values.currency}
              onChange={(value) => update("currency", value)}
              options={CURRENCY_OPTIONS}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="التصنيف" htmlFor="category_id" required error={fieldErrors.category_id}>
            <Select
              id="category_id"
              value={values.category_id}
              onChange={(value) => update("category_id", value)}
              placeholder="اختر التصنيف"
              options={categories.map((category) => ({
                value: category.id,
                label: category.name_ar,
              }))}
            />
          </FormField>
          <FormField label="الحالة" htmlFor="status">
            <Select
              id="status"
              value={values.status}
              onChange={(value) => update("status", value as ProductStatus)}
              options={STATUS_OPTIONS}
            />
          </FormField>
          <FormField label="ترتيب العرض" htmlFor="sort_order" error={fieldErrors.sort_order}>
            <Input
              id="sort_order"
              type="number"
              step={1}
              value={values.sort_order}
              invalid={Boolean(fieldErrors.sort_order)}
              onChange={(event) => update("sort_order", event.target.value)}
            />
          </FormField>
        </div>

        <Checkbox
          id="is_featured"
          checked={values.is_featured}
          label="منتج مميز"
          onChange={(event) => update("is_featured", event.target.checked)}
        />

        <div className="grid gap-2">
          <p className="text-sm font-medium text-zinc-800">صور المنتج</p>
          <ProductGallery
            images={values.images}
            disabled={loading}
            onUpload={onUploadImage}
            onChange={(images) => update("images", images)}
          />
        </div>

        <section className="grid gap-3 rounded-2xl border border-zinc-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">مجموعات الخيارات</h3>
              <p className="text-xs text-zinc-500">الحجم والإضافات والاختيارات المرتبطة بالمنتج</p>
            </div>
            {onAddGroup ? (
              <Button type="button" variant="outline" size="sm" onClick={onAddGroup}>
                <PlusIcon className="size-4" />
                إضافة مجموعة
              </Button>
            ) : null}
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-zinc-500">لا توجد مجموعات خيارات لهذا المنتج.</p>
          ) : (
            <ul className="grid gap-2">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-900">{group.name_ar}</p>
                    <p className="text-xs text-zinc-500">
                      {group.selection_type === "SINGLE" ? "اختيار واحد" : "اختيار متعدد"}
                      {group.is_required ? " · مطلوب" : ""}
                      {group.options?.length ? ` · ${group.options.length} خيارات` : ""}
                    </p>
                  </div>
                  {onEditGroup ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => onEditGroup(group)}>
                      <PencilIcon className="size-4" />
                      تعديل
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-wrap justify-end gap-2">
          {onCancel ? (
            <Button type="button" variant="outline" disabled={loading} onClick={onCancel}>
              إلغاء
            </Button>
          ) : null}
          <Button type="submit" loading={loading}>
            {product ? "حفظ المنتج" : "إضافة المنتج"}
          </Button>
        </div>
      </div>

      <aside className="order-first lg:order-none lg:sticky lg:top-2 h-fit">
        <p className="mb-2 text-sm font-medium text-zinc-800">معاينة مباشرة</p>
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3] bg-zinc-100">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryImage.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-300">
                <ImageIcon className="size-10" />
              </div>
            )}
            {values.is_featured ? (
              <span className="absolute start-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-amber-400 text-white">
                <StarIcon className="size-4 fill-current" />
              </span>
            ) : null}
          </div>
          <div className="grid gap-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900">{values.name_ar || "اسم المنتج"}</p>
                {values.name_en ? (
                  <p className="truncate text-sm text-zinc-500" dir="ltr">
                    {values.name_en}
                  </p>
                ) : null}
              </div>
              <ProductStatusBadge status={values.status} />
            </div>
            {Number.isFinite(previewPrice) && values.price !== "" ? (
              <ProductPrice
                price={previewPrice}
                old_price={previewOldPrice != null && !Number.isNaN(previewOldPrice) ? previewOldPrice : null}
                currency={values.currency}
              />
            ) : (
              <p className="text-sm text-zinc-400">السعر</p>
            )}
          </div>
        </Card>
      </aside>
    </form>
  );
}
