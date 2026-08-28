"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicCartItem } from "@/components/public-menu/public-cart-sheet";
import { PublicSheet } from "@/components/public-menu/public-sheet";
import { QrCodePreview } from "@/components/qr/qr-code-preview";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CarIcon,
  ClipboardIcon,
  QrIcon,
  TableIcon,
  TruckIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";
import { cn } from "@/components/lib/cn";
import { isVenueBusiness, normalizeBusinessType, orderTypeCopy } from "@/lib/business-type";
import { toWhatsAppNumber } from "@/lib/phone";
import {
  buildWhatsAppInvoice,
  createInvoiceNumber,
  openWhatsAppInvoice,
  type OrderDeliveryType,
} from "@/lib/order-invoice";
import type { Branch, Restaurant } from "@/lib/types";

type DeliveryType = OrderDeliveryType;

export function PublicOrderSheet({
  open,
  onOpenChange,
  restaurant,
  branches,
  items,
  menuUrl,
  onBack,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  branches: Array<Pick<Branch, "id" | "name" | "address" | "phone">>;
  items: PublicCartItem[];
  menuUrl?: string;
  onBack: () => void;
}) {
  const businessType = normalizeBusinessType(restaurant.business_type);
  const copy = orderTypeCopy(businessType);
  const venue = isVenueBusiness(businessType);
  const deliveryEnabled = restaurant.delivery_enabled !== false;
  const deliveryOptions = useMemo(
    () =>
      (
        [
          deliveryEnabled ? { id: "delivery" as const, label: copy.delivery, icon: TruckIcon } : null,
          venue && copy.dineIn
            ? { id: "dine_in" as const, label: copy.dineIn, icon: TableIcon }
            : null,
          { id: "pickup" as const, label: copy.pickup, icon: CarIcon },
        ] as const
      ).filter((option): option is NonNullable<typeof option> => option != null),
    [copy.delivery, copy.dineIn, copy.pickup, deliveryEnabled, venue]
  );

  const [deliveryType, setDeliveryType] = useState<DeliveryType>(
    deliveryEnabled ? "delivery" : venue ? "dine_in" : "pickup"
  );
  const [address, setAddress] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [branchId, setBranchId] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const branchOptions = useMemo(() => {
    if (branches.length > 0) {
      return branches.map((branch) => ({ value: branch.id, label: branch.name }));
    }
    return [{ value: "main", label: restaurant.name }];
  }, [branches, restaurant.name]);

  useEffect(() => {
    if (!open) return;
    setBranchId((current) => current || branchOptions[0]?.value || "main");
    setError(null);
  }, [open, branchOptions]);

  useEffect(() => {
    const allowed = new Set(deliveryOptions.map((option) => option.id));
    if (!allowed.has(deliveryType)) {
      setDeliveryType(deliveryOptions[0]?.id ?? "pickup");
    }
  }, [deliveryOptions, deliveryType]);

  const selectedBranch =
    branches.find((branch) => branch.id === branchId) ??
    (branchId === "main" || !branchId ? { name: restaurant.name } : undefined);

  const wa =
    toWhatsAppNumber(restaurant.whatsapp) ?? toWhatsAppNumber(restaurant.phone);
  const qrUrl = menuUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`
    : null;

  function sendWhatsApp() {
    if (!wa) {
      setError("أضف رقم واتساب للمنيو من الإعدادات في لوحة التحكم.");
      return;
    }
    if (deliveryType === "dine_in" && tableNumber.trim().length === 0) {
      setError("أدخل رقم الطاولة.");
      return;
    }
    if (deliveryType === "delivery" && address.trim().length === 0) {
      setError("أدخل عنوان التوصيل.");
      return;
    }
    if (items.length === 0) {
      setError("السلة فارغة.");
      return;
    }

    setError(null);
    const text = buildWhatsAppInvoice({
      restaurantName: restaurant.name,
      items,
      deliveryType,
      address,
      branchName: selectedBranch?.name,
      tableNumber,
      invoiceNumber: createInvoiceNumber(),
      businessType,
    });
    openWhatsAppInvoice(wa, text);
  }

  return (
    <PublicSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setShowQr(false);
          setError(null);
        }
        onOpenChange(next);
      }}
      title="تفاصيل الطلب"
      icon={ClipboardIcon}
      size="md"
      footer={
        <div className="grid gap-2">
          {error ? <p className="text-xs font-medium text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={sendWhatsApp}
              className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              اطلب عبر واتساب
            </button>
            <button
              type="button"
              onClick={onBack}
              className="h-12 flex-1 rounded-xl bg-zinc-700 text-sm font-bold text-white"
            >
              رجوع
            </button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5">
        {!wa ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            لم يُضف رقم واتساب للمنيو بعد. أضفه من لوحة التحكم ← الإعدادات.
          </p>
        ) : null}

        <section>
          <h3 className="mb-2 text-sm font-bold">{copy.sectionTitle}</h3>
          <div className={cn("grid gap-2", deliveryOptions.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {deliveryOptions.map((option) => {
              const selected = deliveryType === option.id;
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setDeliveryType(option.id);
                    setError(null);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-[11px] font-semibold",
                    selected
                      ? "border-sky-500 text-sky-600"
                      : "border-zinc-200 text-zinc-700"
                  )}
                >
                  <Icon className="size-5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        </section>

        {deliveryType === "dine_in" ? (
          <section>
            <h3 className="mb-2 text-sm font-bold">{copy.tableLabel} *</h3>
            <Input
              value={tableNumber}
              onChange={(event) => {
                setTableNumber(event.target.value);
                setError(null);
              }}
              placeholder="مثال: 12"
              inputMode="numeric"
            />
          </section>
        ) : null}

        {deliveryType === "delivery" ? (
          <section>
            <h3 className="mb-2 text-sm font-bold">عنوان التوصيل</h3>
            <Textarea
              rows={3}
              value={address}
              onChange={(event) => {
                setAddress(event.target.value);
                setError(null);
              }}
              placeholder="أدخل عنوان التوصيل..."
            />
          </section>
        ) : null}

        {menuUrl ? (
          <div>
            <button
              type="button"
              onClick={() => setShowQr((value) => !value)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--mh-primary)] text-sm font-bold text-white"
            >
              <QrIcon className="size-5" />
              {showQr ? "إخفاء QR" : "إظهار QR"}
            </button>
            {showQr ? (
              <div className="mt-3 flex justify-center">
                <QrCodePreview qrUrl={qrUrl} name={restaurant.name} className="max-w-48" />
              </div>
            ) : null}
          </div>
        ) : null}

        {branchOptions.length > 1 ? (
          <section>
            <h3 className="mb-2 text-sm font-bold">فرع</h3>
            <select
              value={branchId}
              onChange={(event) => setBranchId(event.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm text-zinc-900 outline-none focus:border-[var(--mh-primary)] focus:ring-4 focus:ring-[var(--mh-primary)]/15"
            >
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>
        ) : null}
      </div>
    </PublicSheet>
  );
}
