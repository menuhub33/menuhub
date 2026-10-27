"use client";

import { useEffect, useState } from "react";
import { createAnalyticsEvent } from "@/modules/analytics/actions/analytics";
import { PublicMenu } from "@/modules/storefront/components/public-menu";
import { MenuNotFound } from "@/modules/storefront/components/menu-not-found";
import type { PublicMenuData } from "@/modules/storefront/types";

const MESSAGES: Record<string, { title: string; description: string }> = {
  NOT_FOUND: {
    title: "المنيو غير موجود",
    description: "تعذر العثور على هذا المطعم.",
  },
  DRAFT: {
    title: "المنيو قيد الإعداد",
    description: "هذا المنيو ما زال مسودة ولم يُنشر بعد.",
  },
  UNPUBLISHED: {
    title: "المنيو غير منشور",
    description: "قام المطعم بإلغاء نشر المنيو مؤقتاً.",
  },
  SUSPENDED: {
    title: "الحساب معلّق",
    description: "تم تعليق هذا المطعم من قبل إدارة المنصة.",
  },
  EXPIRED: {
    title: "انتهى الاشتراك",
    description: "انتهت صلاحية اشتراك هذا المطعم.",
  },
  CANCELLED: {
    title: "الاشتراك ملغى",
    description: "تم إلغاء اشتراك هذا المطعم.",
  },
};

export function PublicMenuView({
  data,
  reason,
  shareUrl,
}: {
  data?: PublicMenuData;
  reason?: keyof typeof MESSAGES;
  shareUrl: string;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!data) return;
    const device =
      window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    const base = { slug: data.restaurant.slug, menu_id: data.menu.id };
    void createAnalyticsEvent({
      ...base,
      event_type: "MENU_VIEW",
      referrer: document.referrer || null,
      metadata: { device },
    });

    // QR codes point to `?src=qr&qr={id}` (see back-end Operations module).
    const params = new URLSearchParams(window.location.search);
    if (params.get("src") === "qr") {
      void createAnalyticsEvent({
        ...base,
        event_type: "QR_SCAN",
        metadata: { qr: params.get("qr") },
      });
    }
  }, [data]);

  if (reason) {
    const message = MESSAGES[reason] ?? MESSAGES.NOT_FOUND;
    return <MenuNotFound title={message.title} description={message.description} />;
  }
  if (!data) return <MenuNotFound />;

  return (
    <PublicMenu
      data={data}
      searchQuery={query}
      onSearch={setQuery}
      shareUrl={shareUrl}
      onShare={() => {
        void createAnalyticsEvent({
          slug: data.restaurant.slug,
          menu_id: data.menu.id,
          event_type: "SHARE",
        });
      }}
      onProductOpen={(product) => {
        void createAnalyticsEvent({
          slug: data.restaurant.slug,
          menu_id: data.menu.id,
          product_id: product.id,
          event_type: "PRODUCT_VIEW",
        });
      }}
    />
  );
}
