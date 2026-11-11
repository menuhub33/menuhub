"use client";

import { useEffect, useState } from "react";
import { createAnalyticsEvent } from "@/modules/analytics/actions/analytics";
import { PublicMenu } from "@/modules/storefront/components/public-menu";
import { MenuNotFound } from "@/modules/storefront/components/menu-not-found";
import type { PublicMenuData } from "@/modules/storefront/types";

let skipViewsUntil = 0;
let lastView: { key: string; at: number } | null = null;
let trackingBound = false;

if (typeof window !== "undefined" && !trackingBound) {
  trackingBound = true;
  window.addEventListener("popstate", () => {
    skipViewsUntil = Date.now() + 1500;
  });
}

/** A view is a fresh open of the menu link, or a QR scan. Reloads and back/forward do not count. */
function menuArrival(slug: string): "link" | "qr" | null {
  if (Date.now() < skipViewsUntil) return null;

  const source = new URLSearchParams(window.location.search).get("src") === "qr" ? "qr" : "link";
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav?.name) {
    const opened = new URL(nav.name);
    const here = new URL(window.location.href);
    const sameDocument = opened.origin === here.origin && opened.pathname === here.pathname;
    if (sameDocument && nav.type !== "navigate") return null;
  }

  const key = `${slug}:${source}:${window.location.pathname}`;
  const now = Date.now();
  if (lastView && lastView.key === key && now - lastView.at < 800) return null;
  lastView = { key, at: now };
  return source;
}

const MESSAGES: Record<string, { title: string; description: string }> = {
  NOT_FOUND: {
    title: "المنيو غير موجود",
    description: "تعذر العثور على هذا النشاط.",
  },
  DRAFT: {
    title: "المنيو قيد الإعداد",
    description: "هذا المنيو ما زال مسودة ولم يُنشر بعد.",
  },
  UNPUBLISHED: {
    title: "المنيو غير منشور",
    description: "تم إلغاء نشر المنيو مؤقتاً.",
  },
  SUSPENDED: {
    title: "الحساب معلّق",
    description: "تم تعليق هذا النشاط من قبل إدارة المنصة.",
  },
  EXPIRED: {
    title: "انتهى الاشتراك",
    description: "انتهت صلاحية اشتراك هذا النشاط.",
  },
  CANCELLED: {
    title: "الاشتراك ملغى",
    description: "تم إلغاء اشتراك هذا النشاط.",
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
    const arrival = menuArrival(data.restaurant.slug);
    if (!arrival) return;

    const device =
      window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop";
    const base = { slug: data.restaurant.slug, menu_id: data.menu.id };
    void createAnalyticsEvent({
      ...base,
      event_type: "MENU_VIEW",
      referrer: document.referrer || null,
      metadata: { device, source: arrival },
    });

    if (arrival === "qr") {
      const params = new URLSearchParams(window.location.search);
      void createAnalyticsEvent({
        ...base,
        event_type: "QR_SCAN",
        metadata: { qr: params.get("qr") },
      });
    }
  }, [data]);

  useEffect(() => {
    const term = query.trim();
    if (!data || term.length < 2) return;
    const timer = window.setTimeout(() => {
      void createAnalyticsEvent({
        slug: data.restaurant.slug,
        menu_id: data.menu.id,
        event_type: "SEARCH",
        metadata: { query: term.slice(0, 80) },
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [data, query]);

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
