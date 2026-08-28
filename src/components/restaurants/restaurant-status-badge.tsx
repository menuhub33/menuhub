import { StatusBadge } from "@/components/common/status-badge";
import type { RestaurantStatus } from "@/lib/types";

export function RestaurantStatusBadge({ status }: { status: RestaurantStatus }) {
  return <StatusBadge kind="restaurant" value={status} />;
}
