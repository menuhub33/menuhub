"use client";

import { useEffect, useState } from "react";
import { createAnalyticsEvent } from "@/actions/analytics/createAnalyticsEvent";
import { PublicMenu } from "@/components/public-menu/public-menu";
import { MenuNotFound } from "@/components/public-menu/menu-not-found";
import type { PublicMenuData } from "@/components/lib/types";

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
    void createAnalyticsEvent({
      restaurant_id: data.restaurant.id,
      menu_id: data.menu.id,
      event_type: "MENU_VIEW",
      device_type: device,
      user_agent: navigator.userAgent,
      referrer: document.referrer || null,
    });
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
          restaurant_id: data.restaurant.id,
          menu_id: data.menu.id,
          event_type: "SHARE",
        });
      }}
      onProductOpen={(product) => {
        void createAnalyticsEvent({
          restaurant_id: data.restaurant.id,
          menu_id: data.menu.id,
          product_id: product.id,
          event_type: "PRODUCT_VIEW",
        });
      }}
    />
  );
}
