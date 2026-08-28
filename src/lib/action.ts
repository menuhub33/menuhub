import type { User } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/config";
import type { PlatformRole, RestaurantRole } from "@/lib/types";

export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}

export async function requireUser() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  if (!user) {
    return {
      supabase,
      user: null as User | null,
      error: "يجب تسجيل الدخول أولاً",
    };
  }

  return { supabase, user, error: null };
}

const loadPlatformProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("platform_role, is_active")
    .eq("id", userId)
    .single();

  return data as { platform_role: PlatformRole; is_active: boolean } | null;
});

export async function requirePlatformAdmin(
  allowed: PlatformRole[] = ["ADMIN", "SUPER_ADMIN"]
) {
  const auth = await requireUser();
  if (auth.error || !auth.user) return auth;

  const profile = await loadPlatformProfile(auth.user.id);

  if (!profile) {
    return { ...auth, user: null, error: "تعذر التحقق من صلاحيات الحساب" };
  }

  if (!profile.is_active) {
    return { ...auth, user: null, error: "الحساب غير نشط" };
  }

  if (!allowed.includes(profile.platform_role as PlatformRole)) {
    return { ...auth, user: null, error: "غير مصرح لك بتنفيذ هذا الإجراء" };
  }

  return auth;
}

export { isValidSlug };

export async function isSlugReserved(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string
) {
  const { data } = await supabase
    .from("reserved_subdomains")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  return Boolean(data);
}

const loadMembership = cache(async (restaurantId: string, userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_users")
    .select("id, role, is_active")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data || !data.is_active) return null;
  return data as { id: string; role: RestaurantRole; is_active: boolean };
});

export async function getRestaurantMembership(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string,
  userId: string
) {
  return loadMembership(restaurantId, userId);
}

export function hasRestaurantRole(
  role: RestaurantRole,
  allowed: RestaurantRole[]
) {
  return allowed.includes(role);
}

export async function getRestaurantIdByMenu(
  supabase: Awaited<ReturnType<typeof createClient>>,
  menuId: string
) {
  const { data } = await supabase
    .from("menus")
    .select("restaurant_id")
    .eq("id", menuId)
    .maybeSingle();

  return (data?.restaurant_id as string | undefined) ?? null;
}

export async function getRestaurantIdByCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: string
) {
  const { data: category } = await supabase
    .from("categories")
    .select("menu_id")
    .eq("id", categoryId)
    .maybeSingle();

  if (!category?.menu_id) return null;
  return getRestaurantIdByMenu(supabase, category.menu_id as string);
}

export async function revalidateRestaurantPublicMenu(
  supabase: Awaited<ReturnType<typeof createClient>>,
  restaurantId: string
) {
  const { data } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", restaurantId)
    .maybeSingle();
  if (data?.slug) revalidatePath(`/m/${data.slug}`);
}

export async function getRestaurantIdByProduct(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string
) {
  const { data: product } = await supabase
    .from("products")
    .select("category_id")
    .eq("id", productId)
    .maybeSingle();

  if (!product?.category_id) return null;
  return getRestaurantIdByCategory(supabase, product.category_id as string);
}

export async function getRestaurantIdByOptionGroup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  optionGroupId: string
) {
  const { data: group } = await supabase
    .from("product_option_groups")
    .select("product_id")
    .eq("id", optionGroupId)
    .maybeSingle();

  if (!group?.product_id) return null;
  return getRestaurantIdByProduct(supabase, group.product_id as string);
}
