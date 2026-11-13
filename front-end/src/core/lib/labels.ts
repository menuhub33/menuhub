import type { DomainStatus } from "@/modules/operations/types";
import type { MenuStatus, ProductStatus } from "@/modules/catalog/types";
import type { PaymentStatus, SubscriptionStatus } from "@/modules/billing/types";
import type { PlatformRole } from "@/modules/auth/types";
import type { RestaurantRole, RestaurantStatus } from "@/modules/tenancy/types";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  AVAILABLE: "متوفر",
  UNAVAILABLE: "غير متوفر",
  HIDDEN: "مخفي",
};

export const MENU_STATUS_LABELS: Record<MenuStatus, string> = {
  DRAFT: "مسودة",
  PUBLISHED: "منشور",
  UNPUBLISHED: "غير منشور",
};

export const RESTAURANT_STATUS_LABELS: Record<RestaurantStatus, string> = {
  TRIAL: "تجريبي",
  ACTIVE: "نشط",
  SUSPENDED: "معلّق",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: "تجريبي",
  ACTIVE: "نشط",
  PAST_DUE: "متأخر السداد",
  EXPIRED: "منتهي",
  CANCELLED: "ملغى",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "قيد الانتظار",
  PAID: "مدفوع",
  FAILED: "فشل",
  REFUNDED: "مسترد",
};

export const DOMAIN_STATUS_LABELS: Record<DomainStatus, string> = {
  PENDING: "قيد الانتظار",
  VERIFYING: "جارٍ التحقق",
  ACTIVE: "نشط",
  FAILED: "فشل",
  DISABLED: "معطّل",
};

export const RESTAURANT_ROLE_LABELS: Record<RestaurantRole, string> = {
  CASHIER: "كاشير",
  WAITER: "نادل",
  KITCHEN: "مطبخ",
  OWNER: "مالك",
  MANAGER: "مدير",
  EDITOR: "محرر",
};

export const PLATFORM_ROLE_LABELS: Record<PlatformRole, string> = {
  USER: "مستخدم",
  ADMIN: "مشرف",
  SUPER_ADMIN: "مشرف عام",
};

export const SOCIAL_PLATFORMS = [
  { value: "whatsapp", label: "واتساب" },
  { value: "instagram", label: "إنستغرام" },
  { value: "facebook", label: "فيسبوك" },
  { value: "tiktok", label: "تيك توك" },
  { value: "twitter", label: "إكس / تويتر" },
  { value: "youtube", label: "يوتيوب" },
  { value: "snapchat", label: "سناب شات" },
  { value: "website", label: "موقع إلكتروني" },
] as const;
