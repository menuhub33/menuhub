import { getBusinessHours } from "@/actions/business-hours/getBusinessHours";
import { HoursView } from "@/components/views/hours-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";

export default async function HoursPage() {
  const tenant = await requirePermission("restaurant.update");
  const hours = await getBusinessHours({ restaurant_id: tenant.restaurant.id, branch_id: null });
  if (hours.error) return <ErrorState description={hours.error} />;
  return <HoursView restaurantId={tenant.restaurant.id} hours={hours.data ?? []} />;
}
