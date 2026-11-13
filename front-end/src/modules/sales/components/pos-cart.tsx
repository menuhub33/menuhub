"use client";

import type { Dispatch } from "react";
import { cn } from "@/core/lib/cn";
import { formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from "@/core/ui/icons";
import { Input } from "@/core/ui/input";
import type { CartAction, CartLine } from "@/modules/sales/lib/cart";
import type { DiscountType, OrderType } from "@/modules/sales/types";

export type OrderForm = {
  orderType: OrderType;
  table: string;
  address: string;
  notes: string;
  /** POS = paid at the till, EXTERNAL = phone / WhatsApp order. */
  source: "POS" | "EXTERNAL";
  discountType: DiscountType;
  discountValue: string;
};

export const EMPTY_FORM: OrderForm = {
  orderType: "TAKEAWAY",
  table: "",
  address: "",
  notes: "",
  source: "POS",
  discountType: "PERCENT",
  discountValue: "",
};

const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: "DINE_IN", label: "محلي" },
  { id: "TAKEAWAY", label: "سفري" },
  { id: "DELIVERY", label: "توصيل" },
];

export function PosCart({
  lines,
  dispatch,
  form,
  onFormChange,
  totals,
  currency,
  busy,
  mode,
  canDiscount,
  onCheckout,
}: {
  lines: CartLine[];
  dispatch: Dispatch<CartAction>;
  form: OrderForm;
  onFormChange: (patch: Partial<OrderForm>) => void;
  totals: { count: number; subtotal: number; discount: number; total: number };
  currency: string;
  busy: boolean;
  mode: "pos" | "waiter";
  canDiscount: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
          <CartIcon className="size-5 text-teal-700" />
          الطلب الحالي
          {totals.count > 0 ? (
            <span className="rounded-full bg-teal-700 px-2 py-0.5 text-xs text-white">{totals.count}</span>
          ) : null}
        </h2>
        {lines.length > 0 ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "clear" })}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            تفريغ
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 border-b border-zinc-100 p-4">
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-zinc-100 p-1">
          {ORDER_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => onFormChange({ orderType: type.id })}
              className={cn(
                "h-9 rounded-lg text-sm font-medium transition",
                form.orderType === type.id ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {form.orderType === "DINE_IN" ? (
          <Input
            placeholder="رقم الطاولة"
            value={form.table}
            onChange={(event) => onFormChange({ table: event.target.value })}
            maxLength={50}
          />
        ) : null}
        {form.orderType === "DELIVERY" ? (
          <Input
            placeholder="عنوان التوصيل"
            value={form.address}
            onChange={(event) => onFormChange({ address: event.target.value })}
            maxLength={1000}
          />
        ) : null}

        {mode === "pos" ? (
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-zinc-100 p-1">
            {(
              [
                { id: "POS", label: "بيع مباشر" },
                { id: "EXTERNAL", label: "طلب هاتف / واتساب" },
              ] as const
            ).map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => onFormChange({ source: source.id })}
                className={cn(
                  "h-9 rounded-lg text-sm font-medium transition",
                  form.source === source.id ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
                )}
              >
                {source.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {lines.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 p-6 text-center text-zinc-400">
            <CartIcon className="size-10" />
            <p className="text-sm">اضغط على منتج لإضافته إلى الطلب</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {lines.map((line) => (
              <li key={line.productId} className="grid gap-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">{line.name}</p>
                    <p className="text-xs text-zinc-500" dir="ltr">
                      {formatPrice(line.unitPrice, currency)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-zinc-900" dir="ltr">
                    {formatPrice(line.unitPrice * line.quantity, currency)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl border border-zinc-200">
                    <button
                      type="button"
                      aria-label="إنقاص"
                      onClick={() => dispatch({ type: "decrease", productId: line.productId })}
                      className="flex size-9 items-center justify-center rounded-s-xl text-zinc-700 hover:bg-zinc-50"
                    >
                      <MinusIcon className="size-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label="زيادة"
                      disabled={line.max != null && line.quantity >= line.max}
                      onClick={() => dispatch({ type: "increase", productId: line.productId })}
                      className="flex size-9 items-center justify-center rounded-e-xl text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
                    >
                      <PlusIcon className="size-4" />
                    </button>
                  </div>
                  <input
                    value={line.note}
                    onChange={(event) =>
                      dispatch({ type: "note", productId: line.productId, note: event.target.value })
                    }
                    placeholder="ملاحظة"
                    maxLength={500}
                    className="h-9 min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 text-xs outline-none focus:border-teal-600"
                  />
                  <button
                    type="button"
                    aria-label="حذف"
                    onClick={() => dispatch({ type: "remove", productId: line.productId })}
                    className="flex size-9 items-center justify-center rounded-xl text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 border-t border-zinc-200 bg-zinc-50 p-4">
        <Input
          placeholder="ملاحظات على الطلب (اختياري)"
          value={form.notes}
          onChange={(event) => onFormChange({ notes: event.target.value })}
          maxLength={1000}
          className="h-10"
        />

        {canDiscount ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-600">خصم</span>
            <Input
              inputMode="decimal"
              value={form.discountValue}
              onChange={(event) => onFormChange({ discountValue: event.target.value })}
              placeholder="0"
              dir="ltr"
              className="h-10 flex-1"
            />
            <div className="flex rounded-xl bg-zinc-200 p-1">
              {(
                [
                  { id: "PERCENT", label: "%" },
                  { id: "FIXED", label: "مبلغ" },
                ] as const
              ).map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => onFormChange({ discountType: type.id })}
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium",
                    form.discountType === type.id ? "bg-white text-teal-800 shadow-sm" : "text-zinc-600"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-1 text-sm">
          {totals.discount > 0 ? (
            <>
              <div className="flex justify-between text-zinc-600">
                <span>المجموع</span>
                <span dir="ltr">{formatPrice(totals.subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>الخصم</span>
                <span dir="ltr">- {formatPrice(totals.discount, currency)}</span>
              </div>
            </>
          ) : null}
          <div className="flex items-center justify-between text-lg font-bold text-zinc-900">
            <span>الإجمالي</span>
            <span dir="ltr">{formatPrice(totals.total, currency)}</span>
          </div>
        </div>

        <Button size="lg" disabled={lines.length === 0} loading={busy} onClick={onCheckout} className="w-full">
          {mode === "waiter" ? "إرسال الطلب" : "الدفع"}
        </Button>
      </div>
    </div>
  );
}
