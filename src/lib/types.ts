export type PlatformRole = "USER" | "ADMIN" | "SUPER_ADMIN";
export type RestaurantStatus =
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";
export type MenuStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type RestaurantRole = "OWNER" | "MANAGER" | "EDITOR";
export type ProductStatus = "AVAILABLE" | "UNAVAILABLE" | "HIDDEN";
export type OptionSelectionType = "SINGLE" | "MULTIPLE";
export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "EXPIRED"
  | "CANCELLED";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type DomainStatus =
  | "PENDING"
  | "VERIFYING"
  | "ACTIVE"
  | "FAILED"
  | "DISABLED";
export type EventType =
  | "MENU_VIEW"
  | "PRODUCT_VIEW"
  | "SEARCH"
  | "QR_SCAN"
  | "SHARE";

export type BusinessType = "RESTAURANT" | "CAFE" | "SHOP";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  platform_role: PlatformRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  default_language: string;
  currency: string;
  status: RestaurantStatus;
  menu_status: MenuStatus;
  delivery_enabled: boolean;
  business_type: BusinessType;
  chatbot_enabled: boolean;
  chatbot_name: string | null;
  chatbot_welcome: string | null;
  created_at: string;
  updated_at: string;
};

export type RestaurantUser = {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: RestaurantRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Menu = {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: MenuStatus;
  is_default: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  menu_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  category_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  old_price: number | null;
  currency: string;
  sort_order: number;
  status: ProductStatus;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
};

export type ProductOptionGroup = {
  id: string;
  product_id: string;
  name_ar: string;
  name_en: string | null;
  selection_type: OptionSelectionType;
  is_required: boolean;
  min_selection: number;
  max_selection: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProductOption = {
  id: string;
  option_group_id: string;
  name_ar: string;
  name_en: string | null;
  price_delta: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Theme = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  preview_image_url: string | null;
  is_active: boolean;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
};

export type RestaurantTheme = {
  id: string;
  restaurant_id: string;
  theme_id: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string | null;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
};

export type SocialLink = {
  id: string;
  restaurant_id: string;
  platform: string;
  url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Branch = {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BusinessHours = {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
  created_at: string;
};

export type QrCode = {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  menu_id: string;
  name: string;
  qr_url: string;
  logo_enabled: boolean;
  format: string;
  created_at: string;
};

export type CustomDomain = {
  id: string;
  restaurant_id: string;
  domain: string;
  status: DomainStatus;
  verification_token: string | null;
  verified_at: string | null;
  ssl_status: string | null;
  created_at: string;
  updated_at: string;
};

export type Plan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_menus: number | null;
  max_products: number | null;
  max_branches: number | null;
  max_staff: number | null;
  analytics_enabled: boolean;
  custom_domain_enabled: boolean;
  remove_branding: boolean;
  advanced_analytics: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  payment_method: string | null;
  transaction_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  restaurant_id: string;
  subscription_id: string | null;
  invoice_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
};

export type AnalyticsEvent = {
  id: string;
  restaurant_id: string;
  branch_id: string | null;
  menu_id: string | null;
  product_id: string | null;
  event_type: EventType;
  session_id: string | null;
  visitor_id: string | null;
  user_agent: string | null;
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  restaurant_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  restaurant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
};

export type ReservedSubdomain = {
  id: string;
  slug: string;
  created_at: string;
};
