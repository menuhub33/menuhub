"use client";

import { useState } from "react";
import { cn } from "@/core/lib/cn";
import { formatAmount, formatPrice } from "@/core/lib/format";
import { Button } from "@/core/ui/button";
import { Dialog } from "@/core/ui/dialog";
import { Input } from "@/core/ui/input";
import { cashSuggestions, parseAmount } from "@/modules/sales/lib/cart";
import type { PaymentMethod } from "@/modules/sales/types";

const METHODS: { id: PaymentMethod; label: string }[] = [
  { id: "CASH", label: "نقداً" },
  { id: "CARD", label: "بطاقة" },
  { id: "OTHER", label: "أخرى" },
];

export function PaymentDialog(props: PaymentDialogProps) {
  // Mounted only while open, so every opening starts from a clean form.
  return props.open ? <PaymentDialogInner {...props} /> : null;
}

type PaymentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Amount to collect. */
  total: number;
  currency: string;
  busy: boolean;
  onConfirm: (method: PaymentMethod, tendered: number | undefined) => void;
  /** Optional "save without paying" action (external / phone orders). */
  skipLabel?: string;
  onSkip?: () => void;
};

function PaymentDialogInner({
  open,
  onOpenChange,
  title,
  total,
  currency,
  busy,
  onConfirm,
  skipLabel,
  onSkip,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [tenderedText, setTenderedText] = useState("");

  const tendered = parseAmount(tenderedText);
  const hasTendered = Number.isFinite(tendered) && tendered > 0;
  const shortfall = method === "CASH" && hasTendered && tendered < total;
  const change = method === "CASH" && hasTendered && tendered >= total ? tendered - total : 0;

  function submit() {
    if (shortfall) return;
    onConfirm(method, method === "CASH" && hasTendered ? tendered : undefined);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next);
      }}
      title={title}
      size="md"
      footer={
        <>
          {onSkip ? (
            <Button variant="outline" disabled={busy} onClick={onSkip}>
              {skipLabel ?? "بدون دفع"}
            </Button>
          ) : null}
          <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button size="lg" loading={busy} disabled={shortfall} onClick={submit}>
            تأكيد الدفع
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div className="rounded-2xl bg-teal-50 px-4 py-3 text-center">
          <p className="text-xs text-teal-800">المبلغ المطلوب</p>
          <p className="mt-1 text-3xl font-bold text-teal-900" dir="ltr">
            {formatPrice(total, currency)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMethod(item.id)}
              className={cn(
                "h-12 rounded-xl border text-sm font-semibold transition",
                method === item.id
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {method === "CASH" ? (
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              المبلغ المستلم من الزبون
              <Input
                inputMode="decimal"
                placeholder={formatAmount(total)}
                value={tenderedText}
                onChange={(event) => setTenderedText(event.target.value)}
                invalid={shortfall}
                dir="ltr"
                className="h-12 text-lg"
                autoFocus
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {cashSuggestions(total).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTenderedText(String(value))}
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
                  dir="ltr"
                >
                  {formatAmount(value)}
                </button>
              ))}
            </div>
            {shortfall ? (
              <p className="text-sm text-red-600">المبلغ المستلم أقل من المطلوب.</p>
            ) : hasTendered ? (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
                <span className="text-sm font-medium text-amber-900">الباقي للزبون</span>
                <span className="text-xl font-bold text-amber-900" dir="ltr">
                  {formatPrice(change, currency)}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
