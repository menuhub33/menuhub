"use client";

import { useState } from "react";
import { createQrCode } from "@/modules/operations/actions/qr-codes";
import { PageHeader } from "@/core/components/layout/page-header";
import { QrCodeCard } from "@/modules/operations/components/qr/qr-code-card";
import { QrCodeGenerator, type QrGenerateValues } from "@/modules/operations/components/qr/qr-code-generator";
import { useToast } from "@/core/ui/toast";
import { useRouter } from "next/navigation";
import { usePublicMenuUrl } from "@/core/providers";
import type { Menu } from "@/modules/catalog/types";
import type { QrCode } from "@/modules/operations/types";
import type { Restaurant } from "@/modules/tenancy/types";

export function QrView({
  restaurant,
  menus,
  codes,
}: {
  restaurant: Restaurant;
  menus: Menu[];
  codes: QrCode[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const url = usePublicMenuUrl(restaurant.slug);

  async function generate(values: QrGenerateValues) {
    setLoading(true);
    // The back-end builds the QR image URL (and the tracked target URL).
    const result = await createQrCode({
      restaurant_id: restaurant.id,
      menu_id: values.menu_id,
      name: values.name,
      logo_enabled: values.logo_enabled,
      format: values.format,
    });
    setLoading(false);
    if (result.error) toast({ title: result.error, variant: "error" });
    else {
      toast({ title: "تم إنشاء رمز QR", variant: "success" });
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="QR Code"
        description="أنشئ رمزاً قابلاً للتحميل والطباعة لرابط المنيو."
        breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "QR Code" }]}
      />
      <p className="rounded-xl bg-white px-4 py-3 text-sm text-zinc-600" dir="ltr">
        {url}
      </p>
      <QrCodeGenerator
        menus={menus}
        loading={loading}
        onGenerate={(values) => void generate(values)}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {codes.map((qr) => (
          <QrCodeCard key={qr.id} qr={qr} restaurantName={restaurant.name} />
        ))}
      </div>
    </div>
  );
}
