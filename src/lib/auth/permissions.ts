import type { PlatformRole, RestaurantRole } from "@/lib/types";

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
  | "staff.manage"
  | "subscription.manage"
  | "settings.view";

const ROLE_PERMISSIONS: Record<RestaurantRole, Permission[]> = {
  OWNER: [
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
    "staff.manage",
    "subscription.manage",
    "settings.view",
  ],
  MANAGER: [
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
    "settings.view",
  ],
  EDITOR: [
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
  ],
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
