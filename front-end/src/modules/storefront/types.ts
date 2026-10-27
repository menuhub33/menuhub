import type { Restaurant } from "@/modules/tenancy/types";
import type { CategoryWithProducts, Menu } from "@/modules/catalog/types";
import type { RestaurantTheme } from "@/modules/theming/types";
import type { Branch, BusinessHours, SocialLink } from "@/modules/operations/types";

export type PublicMenuData = {
  restaurant: Restaurant;
  menu: Menu;
  theme: RestaurantTheme | null;
  categories: CategoryWithProducts[];
  socialLinks?: SocialLink[];
  businessHours?: BusinessHours[];
  /** Plan features that affect the public page (e.g. hide the MenuHub footer). */
  branding?: { remove_branding: boolean };
  branches?: Array<Pick<Branch, "id" | "name" | "address" | "phone">>;
};
