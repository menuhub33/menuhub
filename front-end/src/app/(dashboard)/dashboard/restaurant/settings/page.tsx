import { RestaurantPageShell, RestaurantSettingsForm } from "@/modules/tenancy/views/restaurant-settings-form";
import { requirePermission } from "@/core/auth/authorization";

export default async function RestaurantSettingsPage() {
  const tenant = await requirePermission("restaurant.update");
  return (
    <RestaurantPageShell title="إعدادات النشاط">
      <RestaurantSettingsForm restaurant={tenant.restaurant} />
    </RestaurantPageShell>
  );
}
