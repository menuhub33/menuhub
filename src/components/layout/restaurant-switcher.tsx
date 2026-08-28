"use client";

import { useRouter } from "next/navigation";
import { setCurrentRestaurant } from "@/actions/restaurants/setCurrentRestaurant";
import { Select } from "@/components/ui/select";
import type { Restaurant } from "@/lib/types";

export function RestaurantSwitcher({
  restaurants,
  currentId,
}: {
  restaurants: Pick<Restaurant, "id" | "name">[];
  currentId: string;
}) {
  const router = useRouter();
  if (restaurants.length < 2) return null;

  return (
    <div className="hidden min-w-44 sm:block">
      <Select
        value={currentId}
        onChange={async (value) => {
          await setCurrentRestaurant(value);
          router.refresh();
        }}
        options={restaurants.map((restaurant) => ({
          value: restaurant.id,
          label: restaurant.name,
        }))}
      />
    </div>
  );
}
