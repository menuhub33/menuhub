import type { RestaurantStatus } from "@/modules/tenancy/types";

export function isRestaurantActivated(status: RestaurantStatus | null | undefined) {
  return status === "ACTIVE" || status === "TRIAL";
}
