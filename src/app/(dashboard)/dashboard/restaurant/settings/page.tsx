import { RestaurantPageShell, RestaurantSettingsForm } from "@/components/views/restaurant-settings-form";
import { requirePermission } from "@/lib/auth/authorization";

export default async function RestaurantSettingsPage() {
  const tenant = await requirePermission("restaurant.update");
  return (
    <RestaurantPageShell title="إعدادات النشاط">
      <RestaurantSettingsForm restaurant={tenant.restaurant} />
    </RestaurantPageShell>
  );
}
