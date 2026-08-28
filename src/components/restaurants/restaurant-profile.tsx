import { RestaurantPreview } from "@/components/restaurants/restaurant-preview";
import { RestaurantStatusBadge } from "@/components/restaurants/restaurant-status-badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Restaurant } from "@/lib/types";

export function RestaurantProfile({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="mb-4 flex justify-end">
          <RestaurantStatusBadge status={restaurant.status} />
        </div>
        <RestaurantPreview restaurant={restaurant} />
      </CardContent>
    </Card>
  );
}
