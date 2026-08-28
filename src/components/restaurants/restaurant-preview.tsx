import { Avatar } from "@/components/ui/avatar";
import { MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import type { Restaurant } from "@/lib/types";

export function RestaurantPreview({ restaurant }: { restaurant: Pick<Restaurant, "name" | "description" | "logo_url" | "cover_image_url" | "address" | "phone"> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200">
      <div className="h-32 bg-zinc-100">
        {restaurant.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="relative px-4 pb-4 pt-8">
        <div className="absolute -top-8 start-4">
          <Avatar src={restaurant.logo_url} alt={restaurant.name} size="lg" className="ring-4 ring-white" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">{restaurant.name}</h3>
        {restaurant.description ? (
          <p className="mt-1 text-sm text-zinc-500">{restaurant.description}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-500">
          {restaurant.address ? (
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="size-4" />
              {restaurant.address}
            </span>
          ) : null}
          {restaurant.phone ? (
            <span className="inline-flex items-center gap-1">
              <PhoneIcon className="size-4" />
              {restaurant.phone}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
