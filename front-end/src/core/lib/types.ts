export type NavItem = {
  href: string;
  label: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
  permission?: string;
  /** Hidden unless the restaurant has this optional package. */
  requires?: "pos";
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type SortableItem = {
  id: string;
};
