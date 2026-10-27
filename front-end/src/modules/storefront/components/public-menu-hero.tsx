"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/core/lib/cn";
import type { ProductWithRelations } from "@/modules/catalog/types";
import { productPrimaryImageUrl } from "@/modules/storefront/components/product-image";
import { ShareMenu } from "@/modules/storefront/components/share-menu";
import { ContentImage } from "@/core/ui/content-image";
import { ImageIcon } from "@/core/ui/icons";
import { normalizeBusinessType } from "@/modules/tenancy/lib/business-type";
import type { Restaurant } from "@/modules/tenancy/types";

type HeroSlide = {
  src: string;
  label: string;
};

export function PublicMenuHero({
  restaurant,
  featuredProducts,
  hasOffers = false,
  onShare,
  shareUrl,
}: {
  restaurant: Restaurant;
  featuredProducts: ProductWithRelations[];
  hasOffers?: boolean;
  onShare?: () => void;
  shareUrl?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const showName = normalizeBusinessType(restaurant.business_type) !== "SHOP";

  const slides = useMemo<HeroSlide[]>(() => {
    const items: HeroSlide[] = [];
    const seen = new Set<string>();

    function push(src: string | null | undefined, label: string) {
      if (!src || seen.has(src)) return;
      seen.add(src);
      items.push({ src, label });
    }

    push(restaurant.cover_image_url, restaurant.name);
    for (const product of featuredProducts) {
      push(productPrimaryImageUrl(product), product.name_ar);
    }
    return items.slice(0, 5);
  }, [featuredProducts, restaurant.cover_image_url, restaurant.logo_url, restaurant.name]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const nodes = [...root.children];
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const next = nodes.indexOf(visible.target);
        if (next >= 0) setIndex(next);
      },
      { root, threshold: 0.55 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [slides.length]);

  return (
    <header className="relative">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-[var(--mh-secondary)] shadow-[0_12px_32px_rgba(0,0,0,0.08)]">
        {slides.length > 0 ? (
          <div
            ref={scrollerRef}
            className="flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {slides.map((slide, index) => (
              <div key={slide.src} className="relative h-48 w-full shrink-0 snap-center sm:h-56">
                <ContentImage
                  src={slide.src}
                  alt={slide.label}
                  sizes="100vw"
                  priority={index === 0}
                  className="size-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center bg-[var(--mh-primary)] sm:h-56">
            {restaurant.logo_url ? (
              <img
                src={restaurant.logo_url}
                alt=""
                className="max-h-24 max-w-[70%] object-contain"
              />
            ) : (
              <ImageIcon className="size-12 text-white/70" />
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {hasOffers ? (
          <span className="absolute top-3 start-3 rounded-md bg-fuchsia-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
            OFFERS
          </span>
        ) : null}

        <div className="absolute top-3 end-3">
          <ShareMenu
            title={restaurant.name}
            text={restaurant.description ?? restaurant.name}
            url={shareUrl}
            onShare={onShare}
          />
        </div>

        {restaurant.logo_url && slides.length > 0 ? (
          <img
            src={restaurant.logo_url}
            alt=""
            className="absolute bottom-3 start-3 size-14 rounded-2xl border border-white/70 bg-white object-contain p-1"
          />
        ) : null}

        {showName || slides.length > 1 ? (
          <div className="absolute inset-x-0 bottom-3 px-4">
            {showName ? (
              <p className="truncate text-center text-sm font-semibold text-white drop-shadow">
                {restaurant.name}
              </p>
            ) : null}
            {slides.length > 1 ? (
              <div className={cn("flex items-center justify-center gap-1.5", showName && "mt-2")}>
                {slides.map((slide, slideIndex) => (
                  <span
                    key={slide.src}
                    className={cn(
                      "h-1.5 rounded-full bg-white/70 transition-all",
                      slideIndex === index ? "w-4 bg-white" : "w-1.5"
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
