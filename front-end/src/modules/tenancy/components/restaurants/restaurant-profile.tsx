import { RestaurantPreview } from "@/modules/tenancy/components/restaurants/restaurant-preview";
import { RestaurantStatusBadge } from "@/modules/tenancy/components/restaurants/restaurant-status-badge";
import { Card, CardContent } from "@/core/ui/card";
import type { Restaurant } from "@/modules/tenancy/types";

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
