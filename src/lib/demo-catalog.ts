import type { PublicMenuData } from "@/components/lib/types";
import {
  DEMO_BUSINESS_HOURS,
  DEMO_MENU_SLUG,
  getDemoPublicMenu,
} from "@/lib/demo-menu";
import {
  DEMO_CARS_BUSINESS_HOURS,
  DEMO_CARS_MENU_SLUG,
  getDemoCarsPublicMenu,
} from "@/lib/demo-cars-menu";

export type DemoCatalogHours = Array<{
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}>;

export type DemoCatalog = {
  slug: string;
  branchSlug: string;
  hours: DemoCatalogHours;
  getData: () => PublicMenuData;
};

export const DEMO_CATALOGS: DemoCatalog[] = [
  {
    slug: DEMO_MENU_SLUG,
    branchSlug: "malki",
    hours: DEMO_BUSINESS_HOURS,
    getData: getDemoPublicMenu,
  },
  {
    slug: DEMO_CARS_MENU_SLUG,
    branchSlug: "mezzeh",
    hours: DEMO_CARS_BUSINESS_HOURS,
    getData: getDemoCarsPublicMenu,
  },
];

export function getDemoCatalog(slug: string): DemoCatalog | undefined {
  return DEMO_CATALOGS.find((item) => item.slug === slug);
}
