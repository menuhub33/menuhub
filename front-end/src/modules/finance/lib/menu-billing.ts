export type DiscountType = "NONE" | "PERCENT" | "AMOUNT";
export type InstallmentKind = "INSTALLMENT" | "RENEWAL";
export type InstallmentStatus = "PENDING" | "PAID";

export type BillingAdjustment = "discount" | "installment";

export type PricedPlan = {
  id: string;
  name: string;
  price_yearly: number;
  currency: string;
};

export type PosMode = "OFF" | "CASHIER" | "CASHIER_WAITER";

/** Yearly price of the optional POS packages (edited in /admin/plans). */
export type PosPricing = {
  cashier: number;
  cashier_waiter: number;
  currency: string;
};

/** The part of a contract price that comes from the POS package (0 when OFF or no prices are set). */
export function posPackagePrice(mode: PosMode | undefined, pricing: PosPricing | null | undefined) {
  if (!pricing || !mode || mode === "OFF") return 0;
  return roundMoney(mode === "CASHIER" ? pricing.cashier : pricing.cashier_waiter);
}

export type MenuBillingInput = {
  planId: string;
  /** Plan price + POS package price (the server recomputes it, this is for display). */
  price: number;
  posPrice: number;
  posMode?: PosMode;
  setupCost: number;
  annualRenewal: number;
  discountType: DiscountType;
  discountValue: number;
  installmentsCount: number;
  startsOn: string;
  currency: string;
  notes?: string | null;
};

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

export function parseBillingInput(
  input: {
    planId: string;
    adjustment: BillingAdjustment;
    discountValue: string;
    installmentsCount: string;
    startsOn: string;
    notes?: string;
  },
  plans: PricedPlan[],
  pos?: { mode?: PosMode; pricing?: PosPricing | null }
): { error: string } | { value: MenuBillingInput } {
  const plan = plans.find((item) => item.id === input.planId);
  if (!plan) return { error: "اختر الخطة" };

  const posPrice = posPackagePrice(pos?.mode, pos?.pricing);
  const currency = plan.currency.toUpperCase();
  if (posPrice > 0 && pos?.pricing && pos.pricing.currency.toUpperCase() !== currency) {
    return {
      error: `عملة سعر نقطة البيع (${pos.pricing.currency}) تختلف عن عملة الخطة (${currency}). عدّل عملة الأسعار من صفحة الخطط.`,
    };
  }
  const price = plan.price_yearly + posPrice;
  if (!Number.isFinite(price) || price < 0) return { error: "سعر الخطة غير صالح" };

  const discountMode = input.adjustment === "discount";
  const discountValue = input.discountValue.trim() === "" ? 0 : Number(input.discountValue);
  const installmentsCount = discountMode
    ? 1
    : input.installmentsCount.trim() === ""
      ? 2
      : Number(input.installmentsCount);

  if (discountMode) {
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100) {
      return { error: "نسبة الحسم بين 0 و 100" };
    }
  } else if (!Number.isInteger(installmentsCount) || installmentsCount < 2 || installmentsCount > 24) {
    return { error: "عدد الأقساط يجب أن يكون بين 2 و 24" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startsOn)) return { error: "تاريخ البداية غير صالح" };

  return {
    value: {
      planId: plan.id,
      price: roundMoney(price),
      posPrice,
      posMode: pos?.mode,
      setupCost: 0,
      annualRenewal: 0,
      discountType: discountMode && discountValue > 0 ? "PERCENT" : "NONE",
      discountValue: discountMode ? roundMoney(discountValue) : 0,
      installmentsCount,
      startsOn: input.startsOn,
      currency,
      notes: input.notes?.trim() || null,
    },
  };
}
