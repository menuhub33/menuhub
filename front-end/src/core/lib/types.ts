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

export type SortableItem = {
  id: string;
};
