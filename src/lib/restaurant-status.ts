import type { RestaurantStatus } from "@/lib/types";

export function isRestaurantActivated(status: RestaurantStatus | null | undefined) {
  return status === "ACTIVE" || status === "TRIAL";
}
