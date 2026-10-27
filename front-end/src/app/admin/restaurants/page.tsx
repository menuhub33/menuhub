import { getAdminRestaurants } from "@/modules/platform/actions/admin";
import { AdminRestaurantsView } from "@/modules/platform/views/admin-restaurants-view";
import { ErrorState } from "@/core/components/common/error-state";

export default async function AdminRestaurantsPage() {
  const restaurants = await getAdminRestaurants();
  if (restaurants.error) return <ErrorState description={restaurants.error} />;
  return <AdminRestaurantsView restaurants={restaurants.data ?? []} />;
}
