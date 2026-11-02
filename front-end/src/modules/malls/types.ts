export type MallStatus = "PUBLISHED" | "UNPUBLISHED";

export type MallManager = {
  id: string | null;
  full_name: string | null;
  email: string | null;
};

export type Mall = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  address: string | null;
  status: MallStatus;
  public_url?: string;
  created_at: string;
  updated_at: string;
  manager?: MallManager | null;
};

export type PublicMallStore = {
  id: string;
  name: string;
  slug: string;
  business_type: "RESTAURANT" | "CAFE" | "SHOP";
  logo_url: string | null;
  cover_image_url: string | null;
  description: string | null;
  public_url?: string;
};

export type MallTheme = {
  id?: string;
  mall_id?: string;
  theme_id?: string | null;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  font_family: string | null;
  custom_css: string | null;
};

export type PublicMallState =
  | {
      kind: "live";
      mall: Pick<
        Mall,
        "id" | "name" | "slug" | "description" | "phone" | "logo_url" | "cover_image_url" | "address"
      >;
      theme: MallTheme;
      stores: PublicMallStore[];
    }
  | { kind: "unavailable"; reason: "NOT_FOUND" | "UNPUBLISHED"; name?: string | null };
