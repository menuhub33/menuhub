import type { PlatformRole } from "@/modules/auth/types";
import type { RestaurantRole } from "@/modules/tenancy/types";

/**
 * Role -> permission matrix.
 *
 * Mirror of `back-end/modules/Tenancy/Support/Permissions.php`. The API is the
 * source of truth (every route is guarded by `permission:{name}`); this copy
 * only decides what the UI shows, so keep both files in sync.
 */
export type Permission =
  | "restaurant.view"
  | "restaurant.update"
  | "menu.view"
  | "menu.publish"
  | "categories.view"
  | "categories.create"
  | "categories.update"
  | "categories.delete"
  | "products.view"
  | "products.create"
  | "products.update"
  | "products.delete"
  | "products.availability"
  | "orders.view"
  | "orders.manage"
  | "design.update"
  | "qr.manage"
  | "analytics.view"
  | "audit.view"
  | "staff.manage"
  | "subscription.manage"
  | "branches.manage"
  | "domains.manage"
  | "settings.view"
  | "pos.use"
  | "sales.view"
  | "sales.create"
  | "sales.create_staff"
  | "sales.collect"
  | "sales.discount"
  | "sales.cancel"
  | "sales.refund"
  | "reports.sales"
  | "reports.own"
  | "kitchen.view"
  | "kitchen.manage";

const SALES: Permission[] = [
  "pos.use",
  "sales.view",
  "sales.create",
  "sales.create_staff",
  "sales.collect",
  "sales.discount",
  "sales.cancel",
  "sales.refund",
  "reports.sales",
  "reports.own",
];

const KITCHEN: Permission[] = ["kitchen.view", "kitchen.manage"];

const OWNER: Permission[] = [
  "restaurant.view",
  "restaurant.update",
  "menu.view",
  "menu.publish",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.delete",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "products.availability",
  "orders.view",
  "orders.manage",
  "design.update",
  "qr.manage",
  "analytics.view",
  "audit.view",
  "staff.manage",
  "subscription.manage",
  "branches.manage",
  "domains.manage",
  "settings.view",
  ...SALES,
  ...KITCHEN,
];

const MANAGER: Permission[] = [
  "restaurant.view",
  "restaurant.update",
  "menu.view",
  "menu.publish",
  "categories.view",
  "categories.create",
  "categories.update",
  "categories.delete",
  "products.view",
  "products.create",
  "products.update",
  "products.delete",
  "products.availability",
  "orders.view",
  "orders.manage",
  "analytics.view",
  "audit.view",
  "branches.manage",
  "settings.view",
  ...SALES,
  ...KITCHEN,
];

const EDITOR: Permission[] = [
  "restaurant.view",
  "menu.view",
  "categories.view",
  "categories.create",
  "categories.update",
  "products.view",
  "products.create",
  "products.update",
  "products.availability",
  "settings.view",
];

const CASHIER: Permission[] = [
  "restaurant.view",
  "orders.view",
  "pos.use",
  "sales.view",
  "sales.create",
  "sales.create_staff",
  "sales.collect",
  "reports.own",
  ...KITCHEN,
];

const WAITER: Permission[] = [
  "restaurant.view",
  "orders.view",
  "orders.manage",
  "sales.create_staff",
  "kitchen.view",
];

/** A kitchen account only works the kitchen screen. */
const KITCHEN_STAFF: Permission[] = ["restaurant.view", ...KITCHEN];

const ROLE_PERMISSIONS: Record<RestaurantRole, Permission[]> = {
  OWNER,
  MANAGER,
  EDITOR,
  CASHIER,
  WAITER,
  KITCHEN: KITCHEN_STAFF,
};

export function hasPermission(
  role: RestaurantRole | null | undefined,
  permission: Permission
) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hasAnyPermission(
  role: RestaurantRole | null | undefined,
  permissions: Permission[]
) {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function isPlatformAdmin(role: PlatformRole | null | undefined) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function canAccessAdmin(role: PlatformRole | null | undefined) {
  return isPlatformAdmin(role);
}

/** Platform admins, and mall managers, reach the admin shell. */
export function canAccessConsole(
  role: PlatformRole | null | undefined,
  mall?: { id: string } | null
) {
  return isPlatformAdmin(role) || Boolean(mall?.id);
}
