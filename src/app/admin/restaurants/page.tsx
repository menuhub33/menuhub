import { getAdminRestaurants } from "@/actions/admin/admin";
import { seedDemoMenuIfPossible } from "@/actions/admin/seedDemoMenu";
import { AdminRestaurantsView } from "@/components/views/admin-restaurants-view";
import { ErrorState } from "@/components/common/error-state";

export default async function AdminRestaurantsPage() {
  await seedDemoMenuIfPossible();
  const restaurants = await getAdminRestaurants();
  if (restaurants.error) return <ErrorState description={restaurants.error} />;
  return <AdminRestaurantsView restaurants={restaurants.data ?? []} />;
}
