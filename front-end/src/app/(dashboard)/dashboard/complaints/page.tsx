import { requirePermission } from "@/core/auth/authorization";
import { ErrorState } from "@/core/components/common/error-state";
import { listRestaurantComplaints } from "@/modules/orders/actions/orders";
import { ComplaintsView } from "@/modules/orders/views/complaints-view";

export default async function ComplaintsPage() {
  await requirePermission("orders.view", "/dashboard/complaints");
  const rows = await listRestaurantComplaints();
  if (rows.error || !rows.data) {
    return <ErrorState description={rows.error ?? "تعذر تحميل الشكاوى"} />;
  }

  return (
    <ComplaintsView
      rows={rows.data}
      description="شكاوى الزبائن على منتجات هذا المنيو فقط."
      breadcrumbs={[{ label: "الرئيسية", href: "/dashboard" }, { label: "الشكاوي" }]}
    />
  );
}
