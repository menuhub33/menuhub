import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { getActivePlans, getPosPricing } from "@/modules/billing/actions/billing";
import { getAdminRestaurants } from "@/modules/platform/actions/admin";
import { AdminRestaurantsView } from "@/modules/platform/views/admin-restaurants-view";
import { ErrorState } from "@/core/components/common/error-state";
import { getAdminMalls } from "@/modules/malls/actions/malls";

export default async function AdminRestaurantsPage() {
  const session = await requireConsole("/admin/restaurants");
  const platform = isPlatformAdmin(session.profile.platform_role);
  const [restaurants, malls, plans, posPricing] = await Promise.all([
    getAdminRestaurants(),
    platform ? getAdminMalls() : Promise.resolve({ data: [], error: null }),
    getActivePlans(),
    platform ? getPosPricing() : Promise.resolve({ data: null, error: null }),
  ]);
  if (restaurants.error) return <ErrorState description={restaurants.error} />;
  return (
    <AdminRestaurantsView
      restaurants={restaurants.data ?? []}
      malls={(malls.data ?? []).map((mall) => ({ id: mall.id, name: mall.name }))}
      plans={(plans.data ?? []).map((plan) => ({
        id: plan.id,
        name: plan.name,
        price_yearly: plan.price_yearly,
        currency: plan.currency,
      }))}
      posPricing={posPricing.data}
      lockedMall={platform ? null : session.profile.mall ?? null}
    />
  );
}
