export type MenuStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";

export type ProductStatus = "AVAILABLE" | "UNAVAILABLE" | "HIDDEN";

export type OptionSelectionType = "SINGLE" | "MULTIPLE";

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
