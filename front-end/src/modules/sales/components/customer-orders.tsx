"use client";

import { useEffect, useState } from "react";
import { cn } from "@/core/lib/cn";
import { formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { Spinner } from "@/core/ui/spinner";
import { useToast } from "@/core/ui/toast";
import { confirmOrder, listOrders, rejectOrder } from "@/modules/orders/actions/orders";
import type { OrderStatus, ShopOrder } from "@/modules/orders/types";
import { normalizeBusinessType, orderTypeCopy } from "@/modules/tenancy/lib/business-type";
import type { BusinessType } from "@/modules/tenancy/types";

const FILTERS: { id: OrderStatus; label: string }[] = [
  { id: "PENDING", label: "بانتظار التأكيد" },
  { id: "CONFIRMED", label: "مؤكدة" },
  { id: "REJECTED", label: "مرفوضة" },
];

const EMPTY: Record<OrderStatus, string> = {
  PENDING: "لا توجد طلبات بانتظار التأكيد. تظهر هنا طلبات الزبائن القادمة من المنيو.",
  CONFIRMED: "لا توجد طلبات مؤكدة.",
  REJECTED: "لا توجد طلبات مرفوضة.",
};

const REFRESH_MS = 10_000;

/**
 * The QR-menu orders inbox (same data as /dashboard/orders), inside the till / waiter screen,
 * so staff can confirm or reject customer orders without leaving it.
 */
export function CustomerOrders({
  canManage,
  businessType,
  refreshKey = 0,
  onDecided,
}: {
  canManage: boolean;
  businessType: BusinessType;
  /** Changes when a new order arrives, to reload the list right away. */
  refreshKey?: number;
  /** Called after an order leaves the pending list (confirmed or rejected). */
  onDecided?: () => void;
}) {
  const { toast } = useToast();
  const copy = orderTypeCopy(normalizeBusinessType(businessType));
  const [status, setStatus] = useState<OrderStatus>("PENDING");
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // New customer orders arrive while this screen is open, so the list refreshes by itself.
  useEffect(() => {
    let active = true;
    const refresh = () =>
      void listOrders(status).then((result) => {
        if (!active) return;
        if (result.error || !result.data) {
          setError(result.error ?? "تعذر تحميل الطلبات");
          return;
        }
        setError(null);
        setOrders(result.data.items);
      });

    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [status, refreshKey]);

  function selectStatus(next: OrderStatus) {
    if (next === status) return;
    setOrders(null);
    setError(null);
    setStatus(next);
  }

  async function decide(order: ShopOrder, action: "confirm" | "reject") {
    setPendingId(order.id);
    const result = action === "confirm" ? await confirmOrder(order.id) : await rejectOrder(order.id);
    setPendingId(null);
    if (result.error) {
      toast({ title: result.error, variant: "error" });
      return;
    }
    toast({
      title: action === "confirm" ? "تم تأكيد الطلب وإشعار الزبون" : "تم رفض الطلب",
      variant: "success",
    });
    setOrders((current) => current?.filter((item) => item.id !== order.id) ?? current);
    onDecided?.();
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => selectStatus(filter.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium",
              status === filter.id ? "bg-teal-700 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {orders === null && !error ? (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      ) : null}

      {orders?.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
          {EMPTY[status]}
        </p>
      ) : null}

      <div className="grid gap-3">
        {(orders ?? []).map((order) => {
          const type =
            order.delivery_type === "delivery"
              ? copy.delivery
              : order.delivery_type === "dine_in"
                ? (copy.dineIn ?? "داخل المطعم")
                : copy.pickup;
          const when = new Intl.DateTimeFormat("ar", { dateStyle: "medium", timeStyle: "short" }).format(
            new Date(order.created_at)
          );
          const maps =
            order.latitude != null && order.longitude != null
              ? `https://maps.google.com/?q=${order.latitude},${order.longitude}`
              : null;

          return (
            <article key={order.id} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
              <header className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-zinc-900" dir="ltr">
                    {order.number}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {when} · {type}
                    {order.branch_name ? ` · ${order.branch_name}` : ""}
                  </p>
                </div>
                <p className="text-lg font-bold text-zinc-900">{formatPrice(order.total, order.currency)}</p>
              </header>

              <ul className="grid gap-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4">
                    <span>
                      {item.quantity} × {item.name_ar}
                    </span>
                    {item.line_total == null ? null : (
                      <span className="shrink-0 text-zinc-500">{formatPrice(item.line_total, order.currency)}</span>
                    )}
                  </li>
                ))}
              </ul>

              {order.table_number || order.address || maps ? (
                <p className="text-sm text-zinc-600">
                  {order.table_number ? `${copy.tableLabel}: ${order.table_number}` : null}
                  {order.table_number && order.address ? " · " : null}
                  {order.address}
                  {maps ? (
                    <>
                      {" "}
                      <a href={maps} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline">
                        فتح الخريطة
                      </a>
                    </>
                  ) : null}
                </p>
              ) : null}

              {canManage && order.status === "PENDING" ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={pendingId === order.id}
                    disabled={pendingId != null}
                    onClick={() => void decide(order, "confirm")}
                  >
                    تأكيد
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pendingId != null}
                    onClick={() => void decide(order, "reject")}
                  >
                    رفض
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
