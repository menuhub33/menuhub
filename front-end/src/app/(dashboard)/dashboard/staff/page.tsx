import { getStaff } from "@/modules/tenancy/actions/staff";
import { StaffView } from "@/modules/tenancy/views/staff-view";
import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";

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
