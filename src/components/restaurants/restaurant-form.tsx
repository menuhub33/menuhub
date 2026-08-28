"use client";

import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { RestaurantLogoUpload } from "@/components/restaurants/restaurant-logo-upload";
import { RestaurantCoverUpload } from "@/components/restaurants/restaurant-cover-upload";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Restaurant } from "@/lib/types";

export type RestaurantFormValues = {
  name: string;
  slug: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  timezone: string;
  default_language: string;
  currency: string;
  logo_url: string | null;
  cover_image_url: string | null;
};

const EMPTY: RestaurantFormValues = {
  name: "",
  slug: "",
  description: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  timezone: "Asia/Damascus",
  default_language: "ar",
  currency: "SYP",
  logo_url: null,
  cover_image_url: null,
};

function fromRestaurant(restaurant?: Restaurant | null): RestaurantFormValues {
  if (!restaurant) return EMPTY;
  return {
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description ?? "",
    phone: restaurant.phone ?? "",
    whatsapp: restaurant.whatsapp ?? "",
    email: restaurant.email ?? "",
    address: restaurant.address ?? "",
    timezone: restaurant.timezone,
    default_language: restaurant.default_language,
    currency: restaurant.currency,
    logo_url: restaurant.logo_url,
    cover_image_url: restaurant.cover_image_url,
  };
}

export function RestaurantForm({
  restaurant,
  slugLocked,
  loading,
  error,
  onSubmit,
  onUploadLogo,
  onUploadCover,
}: {
  restaurant?: Restaurant | null;
  slugLocked?: boolean;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: RestaurantFormValues) => void | Promise<void>;
  onUploadLogo?: (file: File) => Promise<string>;
  onUploadCover?: (file: File) => Promise<string>;
}) {
  const [values, setValues] = useState<RestaurantFormValues>(() => fromRestaurant(restaurant));

  function update<K extends keyof RestaurantFormValues>(key: K, value: RestaurantFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(values);
      }}
    >
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <RestaurantLogoUpload
          value={values.logo_url}
          onUploaded={(url) => update("logo_url", url)}
          onUpload={onUploadLogo}
        />
        <RestaurantCoverUpload
          value={values.cover_image_url}
          onUploaded={(url) => update("cover_image_url", url)}
          onUpload={onUploadCover}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="اسم المطعم" htmlFor="name" required>
          <Input
            id="name"
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            required
          />
        </FormField>
        <FormField
          label="المعرّف (slug)"
          htmlFor="slug"
          required
          hint="أحرف إنجليزية صغيرة وأرقام وشرطات فقط"
        >
          <Input
            id="slug"
            dir="ltr"
            value={values.slug}
            disabled={slugLocked}
            onChange={(event) => update("slug", event.target.value.toLowerCase())}
            required
          />
        </FormField>
      </div>
      <FormField label="الوصف" htmlFor="description">
        <Textarea
          id="description"
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="الهاتف" htmlFor="phone">
          <Input id="phone" value={values.phone} onChange={(event) => update("phone", event.target.value)} />
        </FormField>
        <FormField label="واتساب" htmlFor="whatsapp">
          <Input
            id="whatsapp"
            value={values.whatsapp}
            onChange={(event) => update("whatsapp", event.target.value)}
          />
        </FormField>
        <FormField label="البريد الإلكتروني" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
          />
        </FormField>
        <FormField label="العنوان" htmlFor="address">
          <Input
            id="address"
            value={values.address}
            onChange={(event) => update("address", event.target.value)}
          />
        </FormField>
        <FormField label="العملة">
          <Select
            value={values.currency}
            onChange={(value) => update("currency", value)}
            options={[
              { value: "SYP", label: "ليرة سورية" },
              { value: "USD", label: "دولار" },
              { value: "TRY", label: "ليرة تركية" },
              { value: "SAR", label: "ريال سعودي" },
            ]}
          />
        </FormField>
        <FormField label="اللغة الافتراضية">
          <Select
            value={values.default_language}
            onChange={(value) => update("default_language", value)}
            options={[
              { value: "ar", label: "العربية" },
              { value: "en", label: "English" },
            ]}
          />
        </FormField>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>
          حفظ المطعم
        </Button>
      </div>
    </form>
  );
}
