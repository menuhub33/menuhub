import { cn } from "@/components/lib/cn";
import { formatPrice } from "@/components/lib/format";
import type { CategoryWithProducts } from "@/components/lib/types";
import type { RestaurantTheme } from "@/lib/types";
import type { CSSProperties } from "react";

export type LiveMenuPreviewTheme = Pick<
  RestaurantTheme,
  | "primary_color"
  | "secondary_color"
  | "background_color"
  | "text_color"
  | "font_family"
  | "custom_css"
>;

export type LiveMenuPreviewItem = {
  name: string;
  price?: number;
  currency?: string;
};

export function LiveMenuPreview({
  theme,
  restaurantName,
  categoryName,
  productName,
  productPrice,
  currency = "SYP",
  categories,
  className,
}: {
  theme: LiveMenuPreviewTheme;
  restaurantName?: string;
  categoryName?: string;
  productName?: string;
  productPrice?: number;
  currency?: string;
  categories?: CategoryWithProducts[];
  className?: string;
}) {
  const title = restaurantName?.trim() || "اسم المطعم";
  const fallbackCategory = categoryName?.trim() || "اسم القسم";
  const fallbackProduct = productName?.trim() || "اسم المنتج";

  const previewCategories =
    categories && categories.length > 0
      ? categories.slice(0, 4).map((category) => ({
          name: category.name_ar,
          imageUrl: category.image_url,
          products: (category.products ?? []).slice(0, 2).map((product) => ({
            name: product.name_ar,
            price: product.price,
            currency: product.currency,
          })),
        }))
      : [
          {
            name: fallbackCategory,
            imageUrl: null as string | null,
            products: [
              {
                name: fallbackProduct,
                price: productPrice,
                currency,
              },
            ] satisfies LiveMenuPreviewItem[],
          },
        ];

  const previewProducts = previewCategories.flatMap((category) => category.products).slice(0, 4);

  const cssVars = {
    "--mh-primary": theme.primary_color,
    "--mh-secondary": theme.secondary_color,
    "--mh-background": theme.background_color,
    "--mh-text": theme.text_color,
  } as CSSProperties;

  return (
    <div
      className={cn(
        "mh-live-preview overflow-hidden rounded-2xl border border-zinc-200 shadow-sm",
        className
      )}
      style={{
        ...cssVars,
        backgroundColor: "var(--mh-background)",
        color: "var(--mh-text)",
        fontFamily: theme.font_family ?? "inherit",
      }}
    >
      {theme.custom_css ? (
        <style>{`@scope (.mh-live-preview) {\n${theme.custom_css}\n}`}</style>
      ) : null}
      <div
        className="flex h-20 items-end px-4 py-3"
        style={{ backgroundColor: "var(--mh-primary)", color: "var(--mh-secondary)" }}
      >
        <div>
          <p className="text-[10px] opacity-80">المنيو</p>
          <h3 className="truncate text-sm font-bold">{title}</h3>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        <span
          className="flex size-14 shrink-0 items-end rounded-xl p-1.5 text-[10px] font-bold text-white"
          style={{ backgroundColor: "var(--mh-primary)" }}
        >
          الكل
        </span>
        {previewCategories.map((category, categoryIndex) => (
          <span
            key={`${category.name}-${categoryIndex}`}
            className="flex size-14 shrink-0 items-end overflow-hidden rounded-xl bg-zinc-200 p-1.5 text-[9px] font-bold text-white"
            style={{
              backgroundImage: category.imageUrl ? `url(${category.imageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundColor: category.imageUrl ? undefined : "color-mix(in srgb, var(--mh-primary) 35%, #111)",
            }}
          >
            <span className="line-clamp-2 drop-shadow">{category.name}</span>
          </span>
        ))}
      </div>
      <p className="px-3 text-xs font-bold">الأصناف الشائعة</p>
      <div className="grid grid-cols-2 gap-2 px-3 pt-2 pb-4">
        {previewProducts.map((product, index) => (
          <div
            key={`${product.name}-${index}`}
            className="rounded-xl px-2 py-2"
            style={{ backgroundColor: "color-mix(in srgb, var(--mh-text) 6%, var(--mh-background))" }}
          >
            <p className="line-clamp-2 min-h-8 text-center text-[11px] font-medium">{product.name}</p>
            {product.price != null ? (
              <p
                className="mt-1 text-center text-[10px] font-semibold"
                style={{ color: "var(--mh-primary)" }}
              >
                {formatPrice(product.price, product.currency ?? currency)}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
