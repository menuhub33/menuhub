"use client";

import { useEffect, useState } from "react";
import { AlertCircleIcon } from "@/core/ui/icons";
import { Textarea } from "@/core/ui/textarea";
import { reportProductComplaint } from "@/modules/orders/actions/orders";
import { PublicSheet } from "@/modules/storefront/components/public-sheet";

export function OrderComplaintSheet({
  open,
  onOpenChange,
  slug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
}) {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProductName("");
    setDescription("");
    setError(null);
    setDone(false);
  }, [open, slug]);

  async function submit() {
    if (!productName.trim() || !description.trim()) {
      setError("اكتب اسم المنتج وشرح المشكلة");
      return;
    }
    setSending(true);
    setError(null);
    const result = await reportProductComplaint({
      slug,
      productName,
      description,
    });
    setSending(false);
    if (result.error || !result.data) {
      setError(result.error ?? "تعذر إرسال الشكوى");
      return;
    }
    setDone(true);
  }

  return (
    <PublicSheet
      open={open}
      onOpenChange={onOpenChange}
      title="شكاوي"
      icon={AlertCircleIcon}
      footer={
        done ? (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-12 w-full rounded-xl bg-[var(--mh-primary)] text-sm font-bold text-white"
          >
            إغلاق
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void submit()}
            disabled={sending}
            className="h-12 w-full rounded-xl bg-[var(--mh-primary)] text-sm font-bold text-white disabled:opacity-60"
          >
            {sending ? "جارٍ الإرسال..." : "إرسال الشكوى"}
          </button>
        )
      }
    >
      {done ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          وصلت الشكوى لإدارة المنيو. إذا كان المحل داخل مول، تظهر أيضاً لإدارة المول.
        </p>
      ) : (
        <div className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-bold">
            اسم المنتج
            <input
              value={productName}
              maxLength={120}
              onChange={(event) => {
                setProductName(event.target.value);
                setError(null);
              }}
              placeholder="مثال: برغر"
              className="h-11 rounded-xl border border-zinc-200 px-3 text-sm font-medium outline-none focus:border-[var(--mh-primary)]"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            شرح المشكلة
            <Textarea
              rows={4}
              value={description}
              maxLength={1000}
              onChange={(event) => {
                setDescription(event.target.value);
                setError(null);
              }}
              placeholder="مثال: وصل بارد وناقص"
            />
          </label>
          {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
        </div>
      )}
    </PublicSheet>
  );
}
