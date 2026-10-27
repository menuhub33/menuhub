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
  | "options.manage"
  | "design.update"
  | "qr.manage"
  | "analytics.view"
  | "audit.view"
  | "staff.manage"
  | "subscription.manage"
  | "branches.manage"
  | "domains.manage"
  | "settings.view";

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
  "options.manage",
  "design.update",
  "qr.manage",
  "analytics.view",
  "audit.view",
  "staff.manage",
  "subscription.manage",
  "branches.manage",
  "domains.manage",
  "settings.view",
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
  "options.manage",
  "analytics.view",
  "audit.view",
  "branches.manage",
  "settings.view",
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
  "options.manage",
  "settings.view",
];

const ROLE_PERMISSIONS: Record<RestaurantRole, Permission[]> = {
  OWNER,
  MANAGER,
  EDITOR,
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
