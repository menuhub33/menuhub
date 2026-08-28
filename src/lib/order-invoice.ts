import { formatPrice } from "@/components/lib/format";
import type { PublicCartItem } from "@/components/public-menu/public-cart-sheet";
import { normalizeBusinessType, orderTypeCopy } from "@/lib/business-type";
import type { BusinessType } from "@/lib/types";

export type OrderDeliveryType = "delivery" | "dine_in" | "pickup";

export function createInvoiceNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `MH-${stamp}`;
}

export function buildWhatsAppInvoice({
  restaurantName,
  items,
  deliveryType,
  address,
  branchName,
  tableNumber,
  invoiceNumber,
  businessType,
}: {
  restaurantName: string;
  items: PublicCartItem[];
  deliveryType: OrderDeliveryType;
  address?: string;
  branchName?: string;
  tableNumber?: string;
  invoiceNumber: string;
  businessType?: BusinessType | null;
}): string {
  const copy = orderTypeCopy(normalizeBusinessType(businessType));
  const typeLabel =
    deliveryType === "delivery"
      ? copy.delivery
      : deliveryType === "dine_in"
        ? (copy.dineIn ?? "تناول في المكان")
        : copy.pickup;
  const currency = items[0]?.product.currency ?? "SYP";
  const total = items.reduce(
    (sum, item) => sum + (item.product.price + item.extra) * item.quantity,
    0
  );
  const when = new Intl.DateTimeFormat("ar", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const lines = [
    "━━━━━━━━━━━━━━",
    `فاتورة طلب — ${restaurantName}`,
    "━━━━━━━━━━━━━━",
    `رقم الفاتورة: ${invoiceNumber}`,
    `التاريخ: ${when}`,
    `نوع الطلب: ${typeLabel}`,
  ];

  if (tableNumber?.trim()) lines.push(`${copy.tableLabel}: ${tableNumber.trim()}`);
  if (branchName) lines.push(`الفرع: ${branchName}`);
  if (deliveryType === "delivery" && address?.trim()) {
    lines.push(`العنوان: ${address.trim()}`);
  }

  lines.push("", `${copy.itemsLabel}:`, "──────────────");

  items.forEach((item, index) => {
    const unit = item.product.price + item.extra;
    const lineTotal = unit * item.quantity;
    lines.push(
      `${index + 1}) ${item.product.name_ar}`,
      `   ${item.quantity} × ${formatPrice(unit, item.product.currency)} = ${formatPrice(lineTotal, item.product.currency)}`
    );
  });

  lines.push(
    "──────────────",
    `المجموع: ${formatPrice(total, currency)}`,
    "━━━━━━━━━━━━━━",
    "تم إرسال الطلب من المنيو الإلكتروني"
  );

  return lines.join("\n");
}

export function openWhatsAppInvoice(phone: string, text: string) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (opened) return;
  window.location.assign(url);
}
