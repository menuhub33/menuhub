"use client";

import { formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { Dialog } from "@/core/ui/dialog";
import { PrinterIcon } from "@/core/ui/icons";
import type { OrderType, PaymentMethod, Receipt } from "@/modules/sales/types";

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  DINE_IN: "محلي",
  TAKEAWAY: "سفري",
  DELIVERY: "توصيل",
};

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "نقداً",
  CARD: "بطاقة",
  OTHER: "أخرى",
};

// Only the receipt is visible when printing; 80mm thermal paper width.
const PRINT_CSS = `
@media print {
  @page { size: 80mm auto; margin: 4mm; }
  body * { visibility: hidden !important; }
  #pos-receipt, #pos-receipt * { visibility: visible !important; }
  #pos-receipt { position: absolute; inset: 0 auto auto 0; width: 72mm; box-shadow: none !important; }
}`;

export function ReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: Receipt | null;
  onClose: () => void;
}) {
  if (!receipt) return null;
  const { order, restaurant } = receipt;
  const currency = order.currency || restaurant.currency;
  const payments = (order.payments ?? []).filter((payment) => payment.type === "PAYMENT");
  const change = payments.reduce((sum, payment) => sum + (payment.change_amount ?? 0), 0);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={`فاتورة ${order.number}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon className="size-4" />
            طباعة
          </Button>
          <Button onClick={onClose}>بيع جديد</Button>
        </>
      }
    >
      <style>{PRINT_CSS}</style>
      <div
        id="pos-receipt"
        className="mx-auto w-full max-w-[20rem] bg-white font-mono text-[13px] leading-6 text-zinc-900"
      >
        <div className="text-center">
          <p className="text-base font-bold">{restaurant.name}</p>
          {receipt.branch ? <p>{receipt.branch}</p> : null}
          {restaurant.address ? <p>{restaurant.address}</p> : null}
          {restaurant.phone ? (
            <p dir="ltr">{restaurant.phone}</p>
          ) : null}
        </div>

        <hr className="my-2 border-dashed border-zinc-400" />

        <div className="grid gap-0.5">
          <Row label="رقم الفاتورة" value={order.number} ltr />
          {receipt.issued_at_local ? <Row label="التاريخ" value={receipt.issued_at_local} ltr /> : null}
          {order.order_type ? <Row label="النوع" value={ORDER_TYPE_LABELS[order.order_type]} /> : null}
          {order.table_number ? <Row label="الطاولة" value={order.table_number} /> : null}
          {receipt.employee ? <Row label="الموظف" value={receipt.employee} /> : null}
        </div>

        <hr className="my-2 border-dashed border-zinc-400" />

        <ul className="grid gap-1">
          {(order.items ?? []).map((item) => (
            <li key={item.id}>
              <div className="flex justify-between gap-2">
                <span>
                  {item.quantity} × {item.name_ar}
                </span>
                <span dir="ltr">{item.line_total == null ? "—" : formatPrice(item.line_total, currency)}</span>
              </div>
              {item.note ? <p className="text-xs text-zinc-500">{item.note}</p> : null}
            </li>
          ))}
        </ul>

        <hr className="my-2 border-dashed border-zinc-400" />

        <div className="grid gap-0.5">
          {order.discount_total > 0 ? (
            <>
              <Row label="المجموع" value={formatPrice(order.subtotal, currency)} ltr />
              <Row label="الخصم" value={`- ${formatPrice(order.discount_total, currency)}`} ltr />
            </>
          ) : null}
          <div className="flex justify-between text-base font-bold">
            <span>الإجمالي</span>
            <span dir="ltr">{formatPrice(order.total, currency)}</span>
          </div>
          {payments.map((payment) => (
            <Row
              key={payment.id}
              label={`مدفوع (${METHOD_LABELS[payment.method]})`}
              value={formatPrice(payment.tendered_amount ?? payment.amount, currency)}
              ltr
            />
          ))}
          {change > 0 ? <Row label="الباقي" value={formatPrice(change, currency)} ltr /> : null}
          {order.balance_due > 0 ? (
            <Row label="المتبقي" value={formatPrice(order.balance_due, currency)} ltr />
          ) : null}
        </div>

        <hr className="my-2 border-dashed border-zinc-400" />
        <p className="text-center">شكراً لزيارتكم</p>
      </div>
    </Dialog>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span>{label}</span>
      <span dir={ltr ? "ltr" : undefined}>{value}</span>
    </div>
  );
}
