import { getAnalyticsEvent } from "@/actions/analytics/getAnalyticsEvent";
import { getRestaurantProducts } from "@/actions/catalog/getCatalog";
import { AnalyticsView } from "@/components/views/analytics-view";
import { requirePermission } from "@/lib/auth/authorization";
import { ErrorState } from "@/components/common/error-state";

export default async function AnalyticsPage() {
  const tenant = await requirePermission("analytics.view");
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const fromIso = from.toISOString();
  const [events, products] = await Promise.all([
    getAnalyticsEvent({ restaurant_id: tenant.restaurant.id, from: fromIso, limit: 5000 }),
    getRestaurantProducts(tenant.restaurant.id),
  ]);
  if (events.error) return <ErrorState description={events.error} />;
  return (
    <AnalyticsView
      events={events.data ?? []}
      products={(products.data ?? []).map((product) => ({
        id: product.id,
        name_ar: product.name_ar,
        name_en: product.name_en,
        price: product.price,
        currency: product.currency,
      }))}
      initialFrom={fromIso.slice(0, 10)}
      initialTo={to.toISOString().slice(0, 10)}
    />
  );
}
