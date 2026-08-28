import { getAdminRestaurants } from "@/actions/admin/admin";
import { seedDemoMenuIfPossible } from "@/actions/admin/seedDemoMenu";
import { getPlan } from "@/actions/plans/getPlan";
import { AdminRestaurantsView } from "@/components/views/admin-restaurants-view";
import { ErrorState } from "@/components/common/error-state";
import type { Plan } from "@/lib/types";

export default async function AdminRestaurantsPage() {
  await seedDemoMenuIfPossible();
  const [restaurants, plans] = await Promise.all([
    getAdminRestaurants(),
    getPlan(),
  ]);
  if (restaurants.error) return <ErrorState description={restaurants.error} />;
  const restaurantList = Array.isArray(restaurants.data) ? restaurants.data : [];
  const planList = (Array.isArray(plans.data) ? plans.data : plans.data ? [plans.data] : []) as Plan[];
  return (
    <AdminRestaurantsView
      restaurants={restaurantList}
      plans={planList}
    />
  );
}
