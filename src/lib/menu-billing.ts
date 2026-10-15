export type DiscountType = "NONE" | "PERCENT" | "AMOUNT";
export type InstallmentKind = "INSTALLMENT" | "RENEWAL";
export type InstallmentStatus = "PENDING" | "PAID";

export type MenuBillingInput = {
  price: number;
  setupCost: number;
  annualRenewal: number;
  discountType: DiscountType;
  discountValue: number;
  installmentsCount: number;
  startsOn: string;
  currency: string;
  notes?: string | null;
};

export const BILLING_SETUP_MESSAGE =
  "جدول الإدارة المالية غير موجود. نفّذ ملف supabase/migrations/00015_menu_billing.sql في محرر SQL داخل Supabase ثم أعد المحاولة.";

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function netMenuPrice(price: number, discountType: DiscountType, discountValue: number) {
  if (discountType === "PERCENT") {
    const percent = Math.min(100, Math.max(0, discountValue));
    return roundMoney(price * (1 - percent / 100));
  }
  if (discountType === "AMOUNT") {
    return roundMoney(Math.max(0, price - discountValue));
  }
  return roundMoney(price);
}

export function contractProfit(
  price: number,
  discountType: DiscountType,
  discountValue: number,
  setupCost: number
) {
  return roundMoney(netMenuPrice(price, discountType, discountValue) - setupCost);
}

export function installmentAmounts(net: number, count: number) {
  const installments = Math.min(24, Math.max(1, Math.floor(count)));
  if (installments === 1) return [roundMoney(net)];
  const base = Math.floor((net / installments) * 100) / 100;
  const amounts = Array.from({ length: installments }, () => base);
  const assigned = roundMoney(base * (installments - 1));
  amounts[installments - 1] = roundMoney(Math.max(0, net - assigned));
  return amounts;
}

export function addMonths(isoDate: string, months: number) {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, day));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isMissingBillingTable(message: string) {
  return /menu_billings|menu_installments|schema cache|does not exist|relation/i.test(message);
}

export function billingErrorMessage(message: string) {
  if (/setup_cost/i.test(message)) {
    return "عمود التكلفة غير موجود. نفّذ ملف supabase/migrations/00016_menu_billing_setup_cost.sql في Supabase ثم أعد المحاولة.";
  }
  if (isMissingBillingTable(message)) return BILLING_SETUP_MESSAGE;
  return message;
}

export function parseBillingInput(input: {
  price: string;
  setupCost: string;
  annualRenewal: string;
  discountType: string;
  discountValue: string;
  installmentsCount: string;
  startsOn: string;
  currency?: string;
  notes?: string;
}): { error: string } | { value: MenuBillingInput } {
  const price = Number(input.price);
  const setupCost = input.setupCost.trim() === "" ? 0 : Number(input.setupCost);
  const annualRenewal = input.annualRenewal.trim() === "" ? 0 : Number(input.annualRenewal);
  const discountValue = input.discountValue.trim() === "" ? 0 : Number(input.discountValue);
  const installmentsCount = input.installmentsCount.trim() === "" ? 1 : Number(input.installmentsCount);
  const currency = (input.currency || "SYP").toUpperCase();
  const discountType = input.discountType as DiscountType;

  if (!input.price.trim() || !Number.isFinite(price) || price < 0) return { error: "سعر المنيو مطلوب" };
  if (!["SYP", "USD", "TRY", "EUR", "SAR", "AED"].includes(currency)) return { error: "اختر عملة السعر" };
  if (!Number.isFinite(setupCost) || setupCost < 0) return { error: "تكلفة الاستضافة أو التركيب غير صالحة" };
  if (!Number.isFinite(annualRenewal) || annualRenewal < 0) return { error: "سعر التجديد السنوي غير صالح" };
  if (!["NONE", "PERCENT", "AMOUNT"].includes(discountType)) return { error: "نوع الحسم غير صالح" };
  if (!Number.isFinite(discountValue) || discountValue < 0) return { error: "قيمة الحسم غير صالحة" };
  if (discountType === "PERCENT" && discountValue > 100) return { error: "نسبة الحسم لا تتجاوز 100" };
  if (discountType === "AMOUNT" && discountValue > price) return { error: "قيمة الحسم أكبر من سعر المنيو" };
  if (!Number.isInteger(installmentsCount) || installmentsCount < 1 || installmentsCount > 24) {
    return { error: "عدد الأقساط يجب أن يكون بين 1 و 24" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn)) return { error: "تاريخ البداية غير صالح" };

  return {
    value: {
      price: roundMoney(price),
      setupCost: roundMoney(setupCost),
      annualRenewal: roundMoney(annualRenewal),
      discountType,
      discountValue: discountType === "NONE" ? 0 : roundMoney(discountValue),
      installmentsCount,
      startsOn: input.startsOn,
      currency,
      notes: input.notes?.trim() || null,
    },
  };
}
