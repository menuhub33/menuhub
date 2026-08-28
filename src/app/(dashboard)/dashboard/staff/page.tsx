import { getStaff } from "@/actions/staff/staff";
import { StaffView } from "@/components/views/staff-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";

export default async function StaffPage() {
  const tenant = await requirePermission("staff.manage");
  const staff = await getStaff(tenant.restaurant.id);
  if (staff.error) return <ErrorState description={staff.error} />;
  return (
    <StaffView
      restaurantId={tenant.restaurant.id}
      members={staff.data ?? []}
      currentUserId={tenant.user.id}
    />
  );
}
