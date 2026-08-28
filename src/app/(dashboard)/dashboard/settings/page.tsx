import { SettingsView } from "@/components/views/settings-view";
import { requireRestaurantAccess } from "@/lib/auth/authorization";
import { hasPermission } from "@/lib/auth/permissions";

export default async function SettingsPage(props: PageProps<"/dashboard/settings">) {
  const tenant = await requireRestaurantAccess();
  const search = await props.searchParams;
  const tab = typeof search.tab === "string" ? search.tab : undefined;
  return (
    <SettingsView
      profile={tenant.profile}
      restaurant={tenant.restaurant}
      canManageRestaurant={hasPermission(tenant.role, "restaurant.update")}
      canManageSubscription={hasPermission(tenant.role, "subscription.manage")}
      initialTab={tab}
    />
  );
}
