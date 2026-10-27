import { StatusBadge } from "@/core/components/common/status-badge";
import type { RestaurantStatus } from "@/modules/tenancy/types";

export function RestaurantStatusBadge({ status }: { status: RestaurantStatus }) {
  return <StatusBadge kind="restaurant" value={status} />;
}
