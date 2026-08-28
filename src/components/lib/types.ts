import type {
  AnalyticsEvent,
  AuditLog,
  Branch,
  Category,
  Menu,
  Product,
  ProductImage,
  ProductOption,
  ProductOptionGroup,
  Profile,
  Restaurant,
  RestaurantTheme,
  RestaurantUser,
  SocialLink,
} from "@/lib/types";

export type ProductWithImages = Product & {
  images?: ProductImage[];
};

export type OptionGroupWithOptions = ProductOptionGroup & {
  options?: ProductOption[];
};

export type ProductWithRelations = ProductWithImages & {
  option_groups?: OptionGroupWithOptions[];
  category?: Category;
};

export type CategoryWithProducts = Category & {
  products?: ProductWithRelations[];
};

export type MenuWithCategories = Menu & {
  categories?: CategoryWithProducts[];
};

export type StaffMember = RestaurantUser & {
  profile?: Pick<Profile, "id" | "full_name" | "phone" | "avatar_url" | "platform_role">;
};

export type PublicMenuData = {
  restaurant: Restaurant;
  menu: Menu;
  theme: RestaurantTheme | null;
  categories: CategoryWithProducts[];
  socialLinks?: SocialLink[];
  branches?: Array<Pick<Branch, "id" | "name" | "address" | "phone">>;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type AnalyticsSummary = {
  menuViews: number;
  productViews: number;
  qrScans: number;
  shares: number;
  searches: number;
};

export type ProductViewStat = {
  product: Pick<Product, "id" | "name_ar" | "name_en" | "price" | "currency">;
  imageUrl?: string | null;
  views: number;
};

export type DeviceStat = {
  device: string;
  count: number;
};

export type ActivityItem = Pick<
  AuditLog,
  "id" | "action" | "entity_type" | "entity_id" | "created_at"
> & {
  actor_name?: string | null;
};

export type AnalyticsSeries = Pick<
  AnalyticsEvent,
  "event_type" | "created_at" | "device_type" | "product_id"
>;

export type NavItem = {
  href: string;
  label: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
  permission?: string;
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type UploadValue = {
  url: string | null;
  file?: File | null;
};

export type SortableItem = {
  id: string;
};
