"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/core/lib/cn";
import { Button } from "@/core/ui/button";
import { ClockIcon, RefreshIcon } from "@/core/ui/icons";
import { useToast } from "@/core/ui/toast";
import { chime } from "@/modules/orders/lib/use-incoming-orders";
import { listKitchenOrders, setKitchenStatus } from "@/modules/sales/actions/sales";
import type { KitchenOrder, KitchenStatus } from "@/modules/sales/types";

const POLL_MS = 5_000;
const LATE_MIN = 15;
const VERY_LATE_MIN = 25;

const ORDER_TYPE: Record<string, string> = { DINE_IN: "محلي", TAKEAWAY: "سفري", DELIVERY: "توصيل" };
const CHANNEL: Record<string, string> = { POS: "كاشير", STAFF: "نادل", QR: "منيو الزبون", EXTERNAL: "خارجي" };

type ActiveStatus = Exclude<KitchenStatus, "SERVED">;

const COLUMNS: { status: ActiveStatus; title: string; empty: string; accent: string }[] = [
  { status: "NEW", title: "جديد", empty: "لا توجد طلبات جديدة", accent: "bg-red-600" },
  { status: "PREPARING", title: "قيد التحضير", empty: "لا شيء قيد التحضير", accent: "bg-amber-500" },
  { status: "READY", title: "جاهز للتسليم", empty: "لا شيء جاهز", accent: "bg-emerald-600" },
];

const FORWARD: Record<ActiveStatus, { to: KitchenStatus; label: string }> = {
  NEW: { to: "PREPARING", label: "ابدأ التحضير" },
  PREPARING: { to: "READY", label: "جاهز" },
  READY: { to: "SERVED", label: "تم التسليم" },
};

const BACK: Record<ActiveStatus, KitchenStatus | null> = { NEW: null, PREPARING: "NEW", READY: "PREPARING" };

function minutesSince(iso: string | null, now: number) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
}

/**
 * Kitchen display: every confirmed order (cashier, waiter, external or confirmed customer order)
 * shows up here by itself and moves NEW -> PREPARING -> READY -> SERVED.
 */
export function KitchenScreen({
  restaurantName,
  userName,
  canManage,
  backHref,
  initialOrders,
}: {
  restaurantName: string;
  userName: string;
  /** `kitchen.manage`: may move orders along; otherwise the screen is read only. */
  canManage: boolean;
  /** Where to go back to (the till or the dashboard); null for a kitchen-only account. */
  backHref: string | null;
  initialOrders: KitchenOrder[];
}) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<KitchenOrder[]>(initialOrders);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef<Set<string>>(new Set(initialOrders.map((order) => order.id)));
  const busy = useRef<string | null>(null);

  const refresh = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      const result = await listKitchenOrders();
      if (manual) setRefreshing(false);
      if (result.error || !result.data) {
        if (manual) toast({ title: result.error ?? "تعذّر تحميل الطلبات", variant: "error" });
        return;
      }
      if (busy.current) return; // an action is in flight: its own response updates the board

      const fresh = result.data.filter((order) => !seen.current.has(order.id));
      seen.current = new Set([...seen.current, ...result.data.map((order) => order.id)]);
      setOrders(result.data);
      if (fresh.length > 0) {
        chime();
        toast({
          title: fresh.length === 1 ? "طلب جديد" : `${fresh.length} طلبات جديدة`,
          description: fresh.length === 1 ? fresh[0].number : undefined,
          variant: "info",
          duration: 5000,
        });
      }
    },
    [toast]
  );

  useEffect(() => {
    const timer = window.setInterval(() => void refresh(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // Elapsed-time badges tick without hitting the API.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function move(order: KitchenOrder, to: KitchenStatus) {
    busy.current = order.id;
    setBusyId(order.id);
    const result = await setKitchenStatus(order.id, to);
    busy.current = null;
    setBusyId(null);

    if (result.error || !result.data) {
      toast({ title: result.error ?? "تعذّر تحديث الطلب", variant: "error" });
      void refresh(); // e.g. the order was cancelled meanwhile
      return;
    }
    const updated = result.data;
    setOrders((current) =>
      updated.kitchen_status === "SERVED"
        ? current.filter((item) => item.id !== updated.id)
        : current.map((item) => (item.id === updated.id ? updated : item))
    );
  }

  return (
    <div className="flex h-full flex-col bg-zinc-100">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-zinc-900">{restaurantName}</p>
          <p className="text-xs text-zinc-500">
            شاشة المطبخ · {userName} · {orders.length} طلب
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh(true)} disabled={refreshing}>
            <RefreshIcon className={cn("size-4", refreshing && "animate-spin")} />
            تحديث
          </Button>
          {backHref ? (
            <Link href={backHref} className="text-sm font-medium text-teal-700 hover:underline">
              رجوع
            </Link>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto p-3 lg:grid-cols-3 lg:overflow-hidden">
        {COLUMNS.map((column) => {
          const list = orders.filter((order) => order.kitchen_status === column.status);
          return (
            <section key={column.status} className="flex min-h-0 flex-col rounded-2xl bg-zinc-200/60">
              <div className="flex items-center justify-between gap-2 px-4 py-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-zinc-900">
                  <span className={cn("size-3 rounded-full", column.accent)} />
                  {column.title}
                </h2>
                <span className="min-w-7 rounded-full bg-white px-2 text-center text-sm font-bold leading-7 text-zinc-800">
                  {list.length}
                </span>
              </div>
              <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto px-3 pb-3">
                {list.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-500">{column.empty}</p>
                ) : (
                  list.map((order) => (
                    <KitchenCard
                      key={order.id}
                      order={order}
                      status={column.status}
                      now={now}
                      canManage={canManage}
                      busy={busyId === order.id}
                      onMove={(to) => void move(order, to)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function KitchenCard({
  order,
  status,
  now,
  canManage,
  busy,
  onMove,
}: {
  order: KitchenOrder;
  status: ActiveStatus;
  now: number;
  canManage: boolean;
  busy: boolean;
  onMove: (to: KitchenStatus) => void;
}) {
  const minutes = minutesSince(order.confirmed_at, now);
  const late = status !== "READY" && minutes >= LATE_MIN;
  const veryLate = status !== "READY" && minutes >= VERY_LATE_MIN;
  const forward = FORWARD[status];
  const back = BACK[status];

  return (
    <article
      className={cn(
        "rounded-2xl border-2 bg-white p-4 shadow-sm",
        veryLate ? "border-red-500" : late ? "border-amber-400" : "border-transparent"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-bold text-zinc-900" dir="ltr">
            {order.number}
          </p>
          <p className="mt-0.5 text-sm font-medium text-zinc-700">
            {order.order_type ? ORDER_TYPE[order.order_type] : ""}
            {order.table_number ? ` · طاولة ${order.table_number}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {CHANNEL[order.channel] ?? order.channel}
            {order.opened_by ? ` · ${order.opened_by}` : ""}
            {order.branch_name ? ` · ${order.branch_name}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
            veryLate
              ? "bg-red-100 text-red-700"
              : late
                ? "bg-amber-100 text-amber-800"
                : "bg-zinc-100 text-zinc-600"
          )}
        >
          <ClockIcon className="size-3.5" />
          {minutes === 0 ? "الآن" : `${minutes} د`}
        </span>
      </div>

      <ul className="mt-3 grid gap-2 border-t border-zinc-100 pt-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-base font-bold text-white">
              {item.quantity}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-zinc-900">{item.name_ar}</p>
              {item.note ? <p className="text-sm font-medium text-red-700">{item.note}</p> : null}
            </div>
          </li>
        ))}
      </ul>

      {order.notes ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">ملاحظة: {order.notes}</p>
      ) : null}

      {canManage ? (
        <div className="mt-4 flex gap-2">
          <Button size="lg" className="flex-1" loading={busy} onClick={() => onMove(forward.to)}>
            {forward.label}
          </Button>
          {back ? (
            <Button size="lg" variant="outline" disabled={busy} onClick={() => onMove(back)}>
              رجوع
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
