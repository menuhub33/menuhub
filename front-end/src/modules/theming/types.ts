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
