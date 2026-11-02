import { requireConsole } from "@/core/auth/authorization";
import { isPlatformAdmin } from "@/core/auth/permissions";
import { getAdminRestaurants } from "@/modules/platform/actions/admin";
import { AdminRestaurantsView } from "@/modules/platform/views/admin-restaurants-view";
import { ErrorState } from "@/core/components/common/error-state";
import { getAdminMalls } from "@/modules/malls/actions/malls";

export default async function AdminRestaurantsPage() {
  const session = await requireConsole("/admin/restaurants");
  const platform = isPlatformAdmin(session.profile.platform_role);
  const [restaurants, malls] = await Promise.all([
    getAdminRestaurants(),
    platform ? getAdminMalls() : Promise.resolve({ data: [], error: null }),
  ]);
  if (restaurants.error) return <ErrorState description={restaurants.error} />;
  return (
    <AdminRestaurantsView
      restaurants={restaurants.data ?? []}
      malls={(malls.data ?? []).map((mall) => ({ id: mall.id, name: mall.name }))}
      lockedMall={platform ? null : session.profile.mall ?? null}
    />
  );
}
