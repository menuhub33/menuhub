"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/core/lib/cn";
import { DASHBOARD_FONT_FAMILY } from "@/core/lib/font";
import { ContentImage } from "@/core/ui/content-image";
import { ImageIcon } from "@/core/ui/icons";
import { BUSINESS_TYPE_LABELS } from "@/modules/tenancy/lib/business-type";
import type { BusinessType } from "@/modules/tenancy/types";
import type { CategoryWithProducts } from "@/modules/catalog/types";
import { PublicMenuBottomNav, type PublicMenuTab } from "@/modules/storefront/components/public-menu-bottom-nav";
import { PublicMenuFooter } from "@/modules/storefront/components/public-menu-footer";
import { PublicMenuHero } from "@/modules/storefront/components/public-menu-hero";
import {
  ALL_CATEGORIES_ID,
  PublicMenuNavigation,
} from "@/modules/storefront/components/public-menu-navigation";
import { PublicMenuSearch } from "@/modules/storefront/components/public-menu-search";
import { MENU_BACKGROUND } from "@/modules/theming/lib/menu-background";
import { menuGridClass, menuImageSizes, menuShellClass } from "@/modules/storefront/lib/menu-layout";
import type { MallTheme, PublicMallState, PublicMallStore } from "@/modules/malls/types";

const FALLBACK_THEME: MallTheme = {
  primary_color: "#c4a574",
  secondary_color: "#8a6d45",
  background_color: "#f7f7f7",
  text_color: "#18181b",
  font_family: null,
  custom_css: null,
};

const TYPE_ORDER: BusinessType[] = ["RESTAURANT", "CAFE", "SHOP"];

function emptyCategory(id: string, name: string, image: string | null): CategoryWithProducts {
  return {
    id,
    menu_id: "mall",
    name_ar: name,
    name_en: null,
    description_ar: null,
    description_en: null,
    image_url: image,
    sort_order: 0,
    is_active: true,
    created_at: "",
    updated_at: "",
    products: [],
  };
}

export function PublicMallView({
  state,
  shareUrl,
}: {
  state: Extract<PublicMallState, { kind: "live" }>;
  shareUrl: string;
}) {
  const { mall, stores } = state;
  const theme = state.theme ?? FALLBACK_THEME;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(ALL_CATEGORIES_ID);
  const [navTab, setNavTab] = useState<PublicMenuTab>("home");

  const categories = useMemo(
    () =>
      TYPE_ORDER.filter((type) => stores.some((store) => store.business_type === type)).map((type) => {
        const sample = stores.find((store) => store.business_type === type);
        return emptyCategory(type, BUSINESS_TYPE_LABELS[type], sample?.cover_image_url || sample?.logo_url || null);
      }),
    [stores]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stores.filter((store) => {
      if (selectedId !== ALL_CATEGORIES_ID && store.business_type !== selectedId) return false;
      if (!needle) return true;
      return store.name.toLowerCase().includes(needle) || (store.description ?? "").toLowerCase().includes(needle);
    });
  }, [query, selectedId, stores]);

  const sectionTitle =
    selectedId === ALL_CATEGORIES_ID
      ? "المحلات"
      : (categories.find((category) => category.id === selectedId)?.name_ar ?? "المحلات");

  function goHome() {
    setSelectedId(ALL_CATEGORIES_ID);
    setNavTab("home");
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goCategories() {
    setNavTab("categories");
    document.getElementById("menu-categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="mh-mall flex min-h-dvh w-full min-w-0 flex-col text-[var(--mh-text)]"
      style={
        {
          ["--mh-primary"]: theme.primary_color,
          ["--mh-secondary"]: theme.secondary_color,
          ["--mh-bg"]: MENU_BACKGROUND,
          ["--mh-text"]: theme.text_color,
          fontFamily: DASHBOARD_FONT_FAMILY,
        } as CSSProperties
      }
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 backdrop-blur-md"
        style={{ backgroundColor: MENU_BACKGROUND }}
      />
      {theme.custom_css ? <style>{`@scope (.mh-mall) {\n${theme.custom_css}\n}`}</style> : null}
      <div className={menuShellClass}>
        <PublicMenuHero
          restaurant={{
            name: mall.name,
            description: mall.description,
            logo_url: mall.logo_url,
            cover_image_url: mall.cover_image_url,
            business_type: "RESTAURANT",
          }}
          featuredProducts={[]}
          extraSlides={stores
            .map((store) => ({
              src: store.cover_image_url || store.logo_url || "",
              label: store.name,
            }))
            .filter((slide) => slide.src)}
          showTitle
          shareUrl={shareUrl}
        />
        <div className="mt-4">
          <PublicMenuSearch
            value={query}
            onChange={(next) => {
              setQuery(next);
              setNavTab("home");
            }}
            onFilterClick={goCategories}
          />
        </div>
        {categories.length > 0 ? (
          <div className="mt-5">
            <PublicMenuNavigation
              categories={categories}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setNavTab(id === ALL_CATEGORIES_ID ? "home" : "categories");
                setQuery("");
                requestAnimationFrame(() => {
                  document.getElementById("menu-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
                });
              }}
            />
          </div>
        ) : null}
        <section id="menu-products" className="mt-6 scroll-mt-4">
          <h2 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg md:text-xl">{sectionTitle}</h2>
          {visible.length === 0 ? (
            <p className="py-12 text-center text-sm opacity-60">
              {query.trim() ? "لا توجد نتائج مطابقة" : "لا توجد محلات في هذا الدليل"}
            </p>
          ) : (
            <div className={menuGridClass}>
              {visible.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>
        <PublicMenuFooter className="mt-auto" />
      </div>
      <PublicMenuBottomNav
        active={navTab}
        cartCount={0}
        hideCart
        onHome={goHome}
        onCategories={goCategories}
        onBack={() => {
          if (window.history.length > 1) window.history.back();
          else goHome();
        }}
      />
    </div>
  );
}

function StoreCard({ store }: { store: PublicMallStore }) {
  const image = store.cover_image_url || store.logo_url;
  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_28px_rgba(0,0,0,0.06)] ring-1 ring-black/4">
      <Link href={`/m/${store.slug}`} className="block text-start">
        <div className="relative aspect-square overflow-hidden bg-[var(--mh-text)]/8">
          {image ? (
            <ContentImage src={image} alt="" sizes={menuImageSizes} className="size-full object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center">
              <ImageIcon className="size-8 opacity-35" />
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 min-h-9 px-2.5 pt-2.5 text-center text-[13px] font-bold leading-snug sm:min-h-10 sm:text-sm">{store.name}</h3>
      </Link>
      <div className="px-2.5 pt-1 pb-2.5">
        <p className="truncate text-center text-xs font-bold text-[var(--mh-primary)]">
          {BUSINESS_TYPE_LABELS[store.business_type]}
        </p>
        <Link
          href={`/m/${store.slug}`}
          className={cn(
            "mt-2 flex h-9 items-center justify-center rounded-xl text-xs font-bold text-white",
            "bg-[var(--mh-primary)]"
          )}
        >
          تصفح المنتجات
        </Link>
      </div>
    </article>
  );
}
