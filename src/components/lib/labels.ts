import type {
  DomainStatus,
  MenuStatus,
  PaymentStatus,
  PlatformRole,
  ProductStatus,
  RestaurantRole,
  RestaurantStatus,
  SubscriptionStatus,
} from "@/lib/types";

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

export const FONT_OPTIONS = [
  { value: "Expo Arabic", label: "إكسبو عربي" },
  { value: "Cairo", label: "القاهرة" },
  { value: "Tajawal", label: "تجوال" },
  { value: "Almarai", label: "المراعي" },
  { value: "IBM Plex Sans Arabic", label: "IBM Plex Arabic" },
  { value: "Noto Naskh Arabic", label: "نوتو نسخ" },
] as const;
