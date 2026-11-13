import type { Profile } from "@/modules/auth/types";
import type { MenuStatus } from "@/modules/catalog/types";

export type RestaurantStatus =
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export type RestaurantRole = "OWNER" | "MANAGER" | "EDITOR" | "CASHIER" | "WAITER" | "KITCHEN";

export type BusinessType = "RESTAURANT" | "CAFE" | "SHOP";

/** Optional POS package, set per restaurant by a platform admin. */
export type PosMode = "OFF" | "CASHIER" | "CASHIER_WAITER";

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
  pos_mode: PosMode;
  /** Null when the menu belongs to a private store, not a mall. */
  mall_id: string | null;
  mall?: { id: string; name: string; slug: string } | null;
  chatbot_enabled: boolean;
  chatbot_name: string | null;
  chatbot_welcome: string | null;
  /** Public menu address computed by the API (sub-domain or /m/{slug}). */
  public_url?: string;
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

export type ReservedSubdomain = {
  id: string;
  slug: string;
  created_at: string;
};

export type StaffMember = RestaurantUser & {
  profile?: Pick<Profile, "id" | "full_name" | "phone" | "avatar_url" | "platform_role"> & {
    email?: string | null;
  };
};
