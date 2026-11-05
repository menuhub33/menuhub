import { listOrders } from "@/modules/orders/actions/orders";
import { OrdersView } from "@/modules/orders/views/orders-view";
import { requirePermission } from "@/core/auth/authorization";
import { hasPermission } from "@/core/auth/permissions";
import { ErrorState } from "@/core/components/common/error-state";
import type { OrderStatus } from "@/modules/orders/types";

const STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "REJECTED"];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenant = await requirePermission("orders.view");
  const search = await searchParams;
  const raw = typeof search.status === "string" ? search.status : "";
  const status = STATUSES.includes(raw as OrderStatus) ? (raw as OrderStatus) : "PENDING";
  const orders = await listOrders(status);
  if (orders.error || !orders.data) {
    return <ErrorState description={orders.error ?? "تعذر تحميل الطلبات"} />;
  }

  return (
    <OrdersView
      orders={orders.data.items}
      status={status}
      canManage={hasPermission(tenant.role, "orders.manage")}
      businessType={tenant.restaurant.business_type}
    />
  );
}
