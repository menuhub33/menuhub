"use client";

import { useMemo, useState } from "react";
import { cn } from "@/components/lib/cn";
import type {
  CategoryWithProducts,
  ProductWithRelations,
  PublicMenuData,
} from "@/components/lib/types";
import { PublicMenuBottomNav, type PublicMenuTab } from "@/components/public-menu/public-menu-bottom-nav";
import { PublicMenuFooter } from "@/components/public-menu/public-menu-footer";
import { PublicMenuHero } from "@/components/public-menu/public-menu-hero";
import {
  ALL_CATEGORIES_ID,
  PublicMenuNavigation,
} from "@/components/public-menu/public-menu-navigation";
import { PublicMenuSearch } from "@/components/public-menu/public-menu-search";
import { PublicProductGrid } from "@/components/public-menu/public-product-grid";
import { PublicCartSheet } from "@/components/public-menu/public-cart-sheet";
import { PublicOrderSheet } from "@/components/public-menu/public-order-sheet";
import { PublicProductModal } from "@/components/public-menu/public-product-modal";
import { PublicMenuChat } from "@/components/public-menu/public-menu-chat";
import { MenuLoading } from "@/components/public-menu/menu-loading";
import { MenuNotFound } from "@/components/public-menu/menu-not-found";
import {
  isMenuChatbotEnabled,
  menuChatbotName,
  menuChatbotWelcome,
} from "@/lib/menu-chat";
import type { RestaurantTheme } from "@/lib/types";
import type { CSSProperties } from "react";

const FALLBACK_THEME: Pick<
  RestaurantTheme,
  "primary_color" | "secondary_color" | "background_color" | "text_color" | "font_family"
> = {
  primary_color: "#c4a574",
  secondary_color: "#8a6d45",
  background_color: "#f7f7f7",
  text_color: "#18181b",
  font_family: null,
};

function matchesQuery(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function productMatches(product: ProductWithRelations, query: string): boolean {
  if (!query) return true;
  return (
    matchesQuery(product.name_ar, query) ||
    matchesQuery(product.name_en, query) ||
    matchesQuery(product.description_ar, query) ||
    matchesQuery(product.description_en, query)
  );
}

function activeCategories(categories: CategoryWithProducts[]): CategoryWithProducts[] {
  return [...categories]
    .filter((category) => category.is_active !== false)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      ...category,
      products: [...(category.products ?? [])]
        .filter((product) => product.status !== "HIDDEN")
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
}

function productsForView(
  categories: CategoryWithProducts[],
  selectedId: string,
  searchQuery: string
): ProductWithRelations[] {
  const query = searchQuery.trim().toLowerCase();
  const scoped =
    selectedId === ALL_CATEGORIES_ID
      ? categories.flatMap((category) => category.products ?? [])
      : (categories.find((category) => category.id === selectedId)?.products ?? []);

  const matched = query
    ? scoped.filter((product) => productMatches(product, query))
    : scoped;

  if (selectedId !== ALL_CATEGORIES_ID) return matched;

  return [...matched].sort((a, b) => Number(b.is_featured) - Number(a.is_featured));
}

export function PublicMenu({
  data,
  loading = false,
  notFound = false,
  onSearch,
  searchQuery = "",
  onShare,
  onProductOpen,
  removeBranding = false,
  shareUrl,
  className,
}: {
  data?: PublicMenuData;
  loading?: boolean;
  notFound?: boolean;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onShare?: () => void;
  onProductOpen?: (product: ProductWithRelations) => void;
  removeBranding?: boolean;
  shareUrl?: string;
  className?: string;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES_ID);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [openProduct, setOpenProduct] = useState<ProductWithRelations | null>(null);
  const [navTab, setNavTab] = useState<PublicMenuTab>("home");

  const categories = useMemo(
    () => activeCategories(data?.categories ?? []),
    [data?.categories]
  );

  const products = useMemo(
    () => productsForView(categories, selectedCategoryId, searchQuery),
    [categories, selectedCategoryId, searchQuery]
  );

  const featuredProducts = useMemo(
    () =>
      categories
        .flatMap((category) => category.products ?? [])
        .filter((product) => product.is_featured || (product.old_price != null && product.old_price > product.price)),
    [categories]
  );

  const selectedCategory =
    selectedCategoryId === ALL_CATEGORIES_ID
      ? null
      : categories.find((category) => category.id === selectedCategoryId);

  const sectionTitle = selectedCategory?.name_ar ?? "الأصناف الشائعة";
  const cartItems = useMemo(
    () =>
      categories
        .flatMap((category) => category.products ?? [])
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: quantities[product.id] ?? 0,
          extra: extras[product.id] ?? 0,
        })),
    [categories, quantities, extras]
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (notFound || (!loading && !data)) return <MenuNotFound />;
  if (loading || !data) return <MenuLoading />;

  const theme = data.theme ?? FALLBACK_THEME;

  function setQuantity(productId: string, next: number) {
    setQuantities((current) => {
      if (next <= 0) {
        const { [productId]: _removed, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: next };
    });
    if (next <= 0) {
      setExtras((current) => {
        const { [productId]: _removed, ...rest } = current;
        return rest;
      });
    }
  }

  function clearCart() {
    setQuantities({});
    setExtras({});
  }

  function goHome() {
    setSelectedCategoryId(ALL_CATEGORIES_ID);
    setNavTab("home");
    setCartOpen(false);
    setOrderOpen(false);
    setOpenProduct(null);
    onSearch?.("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goCategories() {
    setNavTab("categories");
    setCartOpen(false);
    setOrderOpen(false);
    document.getElementById("menu-categories")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    goHome();
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className={cn(
        "min-h-dvh bg-[var(--mh-bg)] text-[var(--mh-text)] [font-feature-settings:'locl'_0] [font-variant-numeric:lining-nums_tabular-nums]",
        className
      )}
      style={
        {
          ["--mh-primary"]: theme.primary_color,
          ["--mh-secondary"]: theme.secondary_color,
          ["--mh-bg"]: theme.background_color,
          ["--mh-text"]: theme.text_color,
          fontFamily: theme.font_family ?? undefined,
        } as CSSProperties
      }
    >
      <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-28">
        <PublicMenuHero
          restaurant={data.restaurant}
          featuredProducts={featuredProducts}
          hasOffers={featuredProducts.length > 0}
          onShare={onShare}
          shareUrl={shareUrl}
        />
        <div className="mt-4">
          <PublicMenuSearch
            value={searchQuery}
            onChange={(query) => {
              onSearch?.(query);
              setNavTab("home");
            }}
            onFilterClick={goCategories}
          />
        </div>

        <div className="mt-5">
          <PublicMenuNavigation
            categories={categories}
            selectedId={
              categories.some((category) => category.id === selectedCategoryId)
                ? selectedCategoryId
                : ALL_CATEGORIES_ID
            }
            onSelect={(id) => {
              setSelectedCategoryId(id);
              setNavTab(id === ALL_CATEGORIES_ID ? "home" : "categories");
              setCartOpen(false);
              onSearch?.("");
              requestAnimationFrame(() => {
                document.getElementById("menu-products")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              });
            }}
          />
        </div>

        <section id="menu-products" className="mt-6 scroll-mt-4">
          <h2 className="mb-4 text-lg font-bold">{sectionTitle}</h2>
          {products.length === 0 ? (
            <p className="py-12 text-center text-sm opacity-60">
              {searchQuery.trim()
                ? "لا توجد نتائج مطابقة"
                : selectedCategory
                  ? "لا توجد منتجات في هذا القسم بعد."
                  : "لا توجد أصناف في هذا المنيو"}
            </p>
          ) : (
            <PublicProductGrid
              products={products}
              onProductOpen={(product) => {
                setOpenProduct(product);
                onProductOpen?.(product);
              }}
              quantities={quantities}
              onQuantityChange={setQuantity}
            />
          )}
        </section>

        <PublicMenuFooter
          socialLinks={data.socialLinks}
          removeBranding={removeBranding}
        />
      </div>

      <PublicMenuBottomNav
        active={navTab}
        cartCount={cartCount}
        onHome={goHome}
        onCart={() => {
          setNavTab("cart");
          setOrderOpen(false);
          setCartOpen(true);
        }}
        onCategories={goCategories}
        onBack={goBack}
      />

      <PublicCartSheet
        open={cartOpen}
        onOpenChange={(open) => {
          setCartOpen(open);
          if (!open && !orderOpen) {
            setNavTab(selectedCategoryId === ALL_CATEGORIES_ID ? "home" : "categories");
          }
        }}
        items={cartItems}
        onQuantityChange={setQuantity}
        onRemove={(productId) => setQuantity(productId, 0)}
        onClear={clearCart}
        onCheckout={() => {
          if (cartItems.length === 0) return;
          setCartOpen(false);
          setOrderOpen(true);
        }}
      />

      <PublicOrderSheet
        open={orderOpen}
        onOpenChange={(open) => {
          setOrderOpen(open);
          if (!open) setNavTab(selectedCategoryId === ALL_CATEGORIES_ID ? "home" : "categories");
        }}
        restaurant={data.restaurant}
        branches={data.branches ?? []}
        items={cartItems}
        menuUrl={shareUrl}
        onBack={() => {
          setOrderOpen(false);
          setCartOpen(true);
        }}
      />

      <PublicProductModal
        product={openProduct}
        open={openProduct != null}
        initialQuantity={openProduct ? quantities[openProduct.id] ?? 1 : 1}
        onOpenChange={(open) => {
          if (!open) setOpenProduct(null);
        }}
        onAddToCart={(quantity, extra) => {
          if (!openProduct) return;
          setQuantity(openProduct.id, quantity);
          setExtras((current) => ({ ...current, [openProduct.id]: extra }));
        }}
      />

      {isMenuChatbotEnabled(data.restaurant) ? (
        <PublicMenuChat
          slug={data.restaurant.slug}
          name={menuChatbotName(data.restaurant)}
          welcome={menuChatbotWelcome(data.restaurant)}
          onProductOpen={(productId) => {
            const product = categories
              .flatMap((category) => category.products ?? [])
              .find((item) => item.id === productId);
            if (!product) return;
            setOpenProduct(product);
            onProductOpen?.(product);
          }}
        />
      ) : null}
    </div>
  );
}
