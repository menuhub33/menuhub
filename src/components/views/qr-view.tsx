"use client";

import { useState } from "react";
import { createQrCode } from "@/actions/qr-codes/createQrCode";
import { PageHeader } from "@/components/layout/page-header";
import { QrCodeCard } from "@/components/qr/qr-code-card";
import { QrCodeGenerator, type QrGenerateValues } from "@/components/qr/qr-code-generator";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import { publicMenuUrl } from "@/lib/config";
import type { Menu, QrCode, Restaurant } from "@/lib/types";

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
  const url = publicMenuUrl(restaurant.slug);

  async function generate(values: QrGenerateValues) {
    setLoading(true);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(url)}`;
    const result = await createQrCode({
      restaurant_id: restaurant.id,
      menu_id: values.menu_id,
      name: values.name,
      qr_url: qrUrl,
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
