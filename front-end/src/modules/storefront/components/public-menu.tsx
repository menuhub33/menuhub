"use client";

import { useMemo, useState } from "react";
import { cn } from "@/core/lib/cn";
import { hasDiscount } from "@/modules/catalog/lib/merchandising";
import { stockCap } from "@/modules/catalog/lib/stock";
import { normalizeBusinessType, showsStockCount } from "@/modules/tenancy/lib/business-type";
import type { CategoryWithProducts, ProductWithRelations } from "@/modules/catalog/types";
import type { PublicMenuData } from "@/modules/storefront/types";
import { PublicMenuBottomNav, type PublicMenuTab } from "@/modules/storefront/components/public-menu-bottom-nav";
import { PublicMenuFooter } from "@/modules/storefront/components/public-menu-footer";
import { OrderComplaintSheet } from "@/modules/storefront/components/order-complaint-sheet";
import { PublicMenuHero } from "@/modules/storefront/components/public-menu-hero";
import {
  ALL_CATEGORIES_ID,
  PublicMenuNavigation,
} from "@/modules/storefront/components/public-menu-navigation";
import { PublicMenuSearch } from "@/modules/storefront/components/public-menu-search";
import {
  EMPTY_MENU_FILTERS,
  PublicMenuFilterSheet,
  type MenuFilters,
} from "@/modules/storefront/components/public-menu-filter-sheet";
import { PublicProductGrid } from "@/modules/storefront/components/public-product-grid";
import { PublicCartSheet } from "@/modules/storefront/components/public-cart-sheet";
import { PublicOrderSheet } from "@/modules/storefront/components/public-order-sheet";
import { PublicProductModal } from "@/modules/storefront/components/public-product-modal";
import { PublicMenuChat } from "@/modules/chatbot/components/public-menu-chat";
import { MenuLoading } from "@/modules/storefront/components/menu-loading";
import { MenuNotFound } from "@/modules/storefront/components/menu-not-found";
import {
  isMenuChatbotEnabled,
  menuChatbotName,
  menuChatbotWelcome,
} from "@/modules/chatbot/lib/menu-chat";
import type { RestaurantTheme } from "@/modules/theming/types";
import type { CSSProperties } from "react";
import { DASHBOARD_FONT_FAMILY } from "@/core/lib/font";
import { MENU_BACKGROUND } from "@/modules/theming/lib/menu-background";
import { menuShellClass } from "@/modules/storefront/lib/menu-layout";

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

  return matched;
}

function applyMenuFilters(products: ProductWithRelations[], filters: MenuFilters | null) {
  if (!filters) return products;
  const min = filters.min.trim() === "" ? null : Number(filters.min);
  const max = filters.max.trim() === "" ? null : Number(filters.max);
  const bounded = products.filter((product) => {
    if (filters.featured && !product.is_featured) return false;
    if (filters.discounted && !hasDiscount(product)) return false;
    if (min != null && Number.isFinite(min) && (product.price == null || product.price < min)) return false;
    if (max != null && Number.isFinite(max) && (product.price == null || product.price > max)) return false;
    return true;
  });
  const sorted = [...bounded];
  if (filters.sort === "name") {
    sorted.sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
  } else if (filters.sort === "price-asc") {
    sorted.sort((a, b) => (a.price ?? Number.POSITIVE_INFINITY) - (b.price ?? Number.POSITIVE_INFINITY));
  } else if (filters.sort === "price-desc") {
    sorted.sort((a, b) => (b.price ?? Number.NEGATIVE_INFINITY) - (a.price ?? Number.NEGATIVE_INFINITY));
  } else {
    sorted.sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || a.sort_order - b.sort_order);
  }
  return sorted;
}

export function PublicMenu({
  data,
  loading = false,
  notFound = false,
  onSearch,
  searchQuery = "",
  onShare,
  onProductOpen,
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
  shareUrl?: string;
  className?: string;
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(ALL_CATEGORIES_ID);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [openProduct, setOpenProduct] = useState<ProductWithRelations | null>(null);
  const [navTab, setNavTab] = useState<PublicMenuTab>("home");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MenuFilters | null>(null);

  const categories = useMemo(
    () => activeCategories(data?.categories ?? []),
    [data?.categories]
  );

  const products = useMemo(
    () => productsForView(categories, selectedCategoryId, searchQuery),
    [categories, selectedCategoryId, searchQuery]
  );

  const visibleProducts = useMemo(
    () => categories.flatMap((category) => category.products ?? []),
    [categories]
  );
  const featuredProducts = useMemo(
    () => visibleProducts.filter((product) => product.is_featured),
    [visibleProducts]
  );
  const discountedProducts = useMemo(
    () => visibleProducts.filter((product) => hasDiscount(product)),
    [visibleProducts]
  );

  const selectedCategory =
    selectedCategoryId === ALL_CATEGORIES_ID
      ? null
      : categories.find((category) => category.id === selectedCategoryId);

  const displayedProducts = useMemo(
    () => applyMenuFilters(products, filters),
    [products, filters]
  );

  const sectionTitle = filters?.featured && filters.discounted
    ? "مميز وحسومات"
    : filters?.featured
      ? "منتجات مميزة"
      : filters?.discounted
        ? "حسومات"
        : (selectedCategory?.name_ar ?? "الأصناف الشائعة");
  const cartItems = useMemo(
    () =>
      categories
        .flatMap((category) => category.products ?? [])
        .filter((product) => (quantities[product.id] ?? 0) > 0)
        .map((product) => ({
          product,
          quantity: quantities[product.id] ?? 0,
        })),
    [categories, quantities]
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (notFound || (!loading && !data)) return <MenuNotFound />;
  if (loading || !data) return <MenuLoading />;

  const theme = data.theme ?? FALLBACK_THEME;
  const showStockCount = showsStockCount(normalizeBusinessType(data.restaurant.business_type));

  function setQuantity(productId: string, next: number) {
    const product = categories
      .flatMap((category) => category.products ?? [])
      .find((item) => item.id === productId);
    const cap = product ? stockCap(product) : undefined;
    const limited = cap == null ? next : Math.min(next, cap);
    setQuantities((current) => {
      if (limited <= 0) {
        const rest = { ...current };
        delete rest[productId];
        return rest;
      }
      return { ...current, [productId]: limited };
    });
  }

  function clearCart() {
    setQuantities({});
  }

  function showOffers() {
    setFilters((current) => {
      const next = {
        ...(current ?? EMPTY_MENU_FILTERS),
        discounted: !(current?.discounted ?? false),
      };
      const idle =
        !next.featured &&
        !next.discounted &&
        next.min.trim() === "" &&
        next.max.trim() === "" &&
        next.sort === "name";
      return idle ? null : next;
    });
    setSelectedCategoryId(ALL_CATEGORIES_ID);
    setNavTab("home");
    setCartOpen(false);
    onSearch?.("");
    requestAnimationFrame(() => {
      document.getElementById("menu-products")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function goHome() {
    setSelectedCategoryId(ALL_CATEGORIES_ID);
    setFilters(null);
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
        "flex min-h-dvh w-full min-w-0 flex-col text-[var(--mh-text)] [font-feature-settings:'locl'_0] [font-variant-numeric:lining-nums_tabular-nums]",
        className
      )}
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
      <div className={menuShellClass}>
        <PublicMenuHero
          restaurant={data.restaurant}
          featuredProducts={featuredProducts}
          hasOffers={discountedProducts.length > 0}
          onOffers={showOffers}
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
            onFilterClick={() => setFilterOpen(true)}
            filterActive={filters != null}
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
          <h2 className="mb-3 text-base font-bold sm:mb-4 sm:text-lg md:text-xl">{sectionTitle}</h2>
          {displayedProducts.length === 0 ? (
            <p className="py-12 text-center text-sm opacity-60">
              {searchQuery.trim() || filters
                ? "لا توجد نتائج مطابقة"
                : selectedCategory
                    ? "لا توجد منتجات في هذا القسم بعد."
                    : "لا توجد أصناف في هذا المنيو"}
            </p>
          ) : (
            <PublicProductGrid
              products={displayedProducts}
              showStockCount={showStockCount}
              onProductOpen={(product) => {
                setOpenProduct(product);
                onProductOpen?.(product);
              }}
              quantities={quantities}
              onQuantityChange={setQuantity}
            />
          )}
        </section>

        <PublicMenuFooter className="mt-auto" socialLinks={data.socialLinks} />
      </div>

      <PublicMenuBottomNav
        active={navTab}
        cartCount={cartCount}
        onHome={() => {
          setComplaintOpen(false);
          goHome();
        }}
        onCart={() => {
          setComplaintOpen(false);
          setNavTab("cart");
          setOrderOpen(false);
          setCartOpen(true);
        }}
        onCategories={() => {
          setComplaintOpen(false);
          goCategories();
        }}
        onComplaints={() => {
          setCartOpen(false);
          setOrderOpen(false);
          setNavTab("complaints");
          setComplaintOpen(true);
        }}
        onBack={() => {
          setComplaintOpen(false);
          goBack();
        }}
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
        onPlaced={() => {
          clearCart();
          setOrderOpen(false);
          setNavTab(selectedCategoryId === ALL_CATEGORIES_ID ? "home" : "categories");
        }}
      />

      <OrderComplaintSheet
        open={complaintOpen}
        onOpenChange={(open) => {
          setComplaintOpen(open);
          if (!open && navTab === "complaints") {
            setNavTab(selectedCategoryId === ALL_CATEGORIES_ID ? "home" : "categories");
          }
        }}
        slug={data.restaurant.slug}
      />

      <PublicMenuFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters ?? EMPTY_MENU_FILTERS}
        currency={data.restaurant.currency || "SYP"}
        onApply={setFilters}
        onClear={() => setFilters(null)}
      />

      <PublicProductModal
        product={openProduct}
        open={openProduct != null}
        initialQuantity={openProduct ? quantities[openProduct.id] ?? 1 : 1}
        onOpenChange={(open) => {
          if (!open) setOpenProduct(null);
        }}
        onAddToCart={(quantity) => {
          if (!openProduct) return;
          setQuantity(openProduct.id, quantity);
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
