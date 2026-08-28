import { ShareMenu } from "@/components/public-menu/share-menu";
import type { Restaurant } from "@/lib/types";

export function PublicMenuHeader({
  restaurant,
  onShare,
  shareUrl,
}: {
  restaurant: Restaurant;
  onShare?: () => void;
  shareUrl?: string;
}) {
  return (
    <header className="relative">
      <div className="relative h-44 overflow-hidden bg-[var(--mh-secondary)] sm:h-56">
        {restaurant.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.cover_image_url}
            alt=""
            className="size-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--mh-bg)] to-transparent" />
        <div className="absolute top-3 start-3">
          <ShareMenu
            title={restaurant.name}
            text={restaurant.description ?? restaurant.name}
            url={shareUrl}
            onShare={onShare}
          />
        </div>
      </div>

      <div className="relative -mt-10 px-0 pb-4">
        <div className="flex items-end gap-3">
          <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-[var(--mh-primary)]/15 ring-4 ring-[var(--mh-bg)]">
            {restaurant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo_url}
                alt={restaurant.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-2xl font-bold text-[var(--mh-primary)]">
                {restaurant.name.slice(0, 1)}
              </span>
            )}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight">{restaurant.name}</h1>
        {restaurant.description ? (
          <p className="mt-1 text-sm leading-relaxed opacity-75">{restaurant.description}</p>
        ) : null}
      </div>
    </header>
  );
}
