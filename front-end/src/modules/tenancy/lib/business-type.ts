import type { BusinessType } from "@/modules/tenancy/types";

export type { BusinessType };

export function normalizeBusinessType(value: string | null | undefined): BusinessType {
  if (value === "CAFE" || value === "SHOP" || value === "RESTAURANT") return value;
  return "RESTAURANT";
}

export function isVenueBusiness(type: BusinessType) {
  return type === "RESTAURANT" || type === "CAFE";
}

/** Remaining stock is a commercial-center concern. Restaurants and cafes do not show a product count. */
export function showsStockCount(type: BusinessType) {
  return !isVenueBusiness(type);
}

export function orderTypeCopy(type: BusinessType) {
  const venue = type === "CAFE" ? "الكافيه" : "المطعم";
  return {
    sectionTitle: type === "SHOP" ? "طريقة الطلب" : "نوع الطلب",
    delivery: "التوصيل",
    pickup: type === "SHOP" ? "الاستلام من المركز" : "الاستلام",
    dineIn: type === "SHOP" ? null : (`تناول في ${venue}` as const),
    tableLabel: "رقم الطاولة",
    itemsLabel: type === "SHOP" ? "المنتجات" : "الأصناف",
  };
}

export const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string; hint: string }> = [
  { value: "RESTAURANT", label: "مطعم", hint: "يظهر خيار التناول في المطعم ورقم الطاولة" },
  { value: "CAFE", label: "كافيه", hint: "يظهر خيار التناول في الكافيه ورقم الطاولة" },
  { value: "SHOP", label: "مركز تجاري", hint: "للمراكز التجارية (معارض، محلات، وغيرها) بدون تناول في المكان" },
];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  RESTAURANT: "مطعم",
  CAFE: "كافيه",
  SHOP: "مركز تجاري",
};

export function dashboardIntro(type: BusinessType): string {
  const place = type === "CAFE" ? "كافيهك" : type === "SHOP" ? "مركزك التجاري" : "مطعمك";
  return `هذه نظرة سريعة على منيو ${place} اليوم.`;
}
