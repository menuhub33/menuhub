import { getNotification } from "@/modules/notifications/actions/notifications";
import { DashboardShell } from "@/core/components/layout/dashboard-shell";
import { requireRestaurantAccess } from "@/core/auth/authorization";

export default async function DashboardGroupLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const tenant = await requireRestaurantAccess("/dashboard");
  const notifications = await getNotification({ restaurant_id: tenant.restaurant.id });

  return (
    <DashboardShell
      restaurant={tenant.restaurant}
      restaurants={tenant.restaurants}
      profile={tenant.profile}
      role={tenant.role}
      notifications={notifications.data ?? []}
    >
      {children}
    </DashboardShell>
  );
}
