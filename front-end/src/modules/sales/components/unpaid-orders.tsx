"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDateTime, formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { RefreshIcon } from "@/core/ui/icons";
import { Spinner } from "@/core/ui/spinner";
import { useToast } from "@/core/ui/toast";
import { PaymentDialog } from "@/modules/sales/components/payment-dialog";
import { collectPayment, listUnpaidSales } from "@/modules/sales/actions/sales";
import type { PaymentMethod, Sale } from "@/modules/sales/types";

const ORDER_TYPE: Record<string, string> = { DINE_IN: "محلي", TAKEAWAY: "سفري", DELIVERY: "توصيل" };

/** Waiter / phone orders waiting for the cashier to collect the money. */
export function UnpaidOrders({ onPaid }: { onPaid: (saleId: string) => void }) {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sale | null>(null);
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ signature: string; key: string } | null>(null);

  const apply = useCallback(
    (result: Awaited<ReturnType<typeof listUnpaidSales>>) => {
      setLoading(false);
      if (result.error || !result.data) {
        toast({ title: result.error ?? "تعذّر تحميل الطلبات", variant: "error" });
        return;
      }
      setSales(result.data);
    },
    [toast]
  );

  useEffect(() => {
    let active = true;
    void listUnpaidSales().then((result) => {
      if (active) apply(result);
    });
    return () => {
      active = false;
    };
  }, [apply]);

  function refresh() {
    setLoading(true);
    void listUnpaidSales().then(apply);
  }

  async function collect(method: PaymentMethod, tendered: number | undefined) {
    if (!selected) return;
    const body = { method, tendered_amount: tendered };
    // The same key is reused for an identical retry, so a lost response never double-charges.
    const signature = JSON.stringify([selected.id, body]);
    if (attempt.current?.signature !== signature) {
      attempt.current = { signature, key: crypto.randomUUID() };
    }

    setBusy(true);
    const result = await collectPayment(selected.id, body, attempt.current.key);
    setBusy(false);
    if (result.error || !result.data) {
      toast({ title: result.error ?? "تعذّر التحصيل", variant: "error" });
      return;
    }
    attempt.current = null;
    const paidId = selected.id;
    setSelected(null);
    toast({ title: "تم تحصيل المبلغ", variant: "success" });
    refresh();
    onPaid(paidId);
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">طلبات بانتظار التحصيل</h2>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshIcon className="size-4" />
          تحديث
        </Button>
      </div>

      {loading && sales == null ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : sales && sales.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center text-sm text-zinc-500">
          لا توجد طلبات بانتظار التحصيل.
        </p>
      ) : (
        <ul className="grid gap-3">
          {(sales ?? []).map((sale) => (
            <li
              key={sale.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900" dir="ltr">
                  {sale.number}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {sale.order_type ? ORDER_TYPE[sale.order_type] : ""}
                  {sale.table_number ? ` · طاولة ${sale.table_number}` : ""}
                  {sale.opened_by?.name ? ` · ${sale.opened_by.name}` : ""}
                  {` · ${formatDateTime(sale.created_at)}`}
                </p>
                <p className="mt-1 truncate text-sm text-zinc-600">
                  {(sale.items ?? []).map((item) => `${item.quantity}× ${item.name_ar}`).join("، ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-end">
                  <p className="text-xs text-zinc-500">المتبقي</p>
                  <p className="text-lg font-bold text-zinc-900" dir="ltr">
                    {formatPrice(sale.balance_due, sale.currency)}
                  </p>
                </div>
                <Button onClick={() => setSelected(sale)}>تحصيل</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PaymentDialog
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected ? `تحصيل ${selected.number}` : "تحصيل"}
        total={selected?.balance_due ?? 0}
        currency={selected?.currency ?? "SYP"}
        busy={busy}
        onConfirm={(method, tendered) => void collect(method, tendered)}
      />
    </div>
  );
}
