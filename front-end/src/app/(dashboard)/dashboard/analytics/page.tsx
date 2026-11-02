import { getAnalyticsEvent } from "@/modules/analytics/actions/analytics";
import { getRestaurantProducts } from "@/modules/catalog/actions/catalog";
import { AnalyticsView } from "@/modules/analytics/views/analytics-view";
import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";

export default async function AnalyticsPage() {
  const tenant = await requirePermission("analytics.view");
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  const loadFrom = new Date();
  loadFrom.setDate(loadFrom.getDate() - 89);
  const [events, products] = await Promise.all([
    getAnalyticsEvent({
      restaurant_id: tenant.restaurant.id,
      from: loadFrom.toISOString(),
      limit: 5000,
    }),
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
        status: product.status,
        categoryName: product.category?.name_ar ?? "بدون قسم",
      }))}
      initialFrom={from.toISOString().slice(0, 10)}
      initialTo={to.toISOString().slice(0, 10)}
    />
  );
}
