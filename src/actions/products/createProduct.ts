"use server";

import {
  fail,
  getRestaurantIdByCategory,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Product } from "@/lib/types";

export type CreateProductInput = {
  category_id: string;
  name_ar: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  price: number;
  old_price?: number | null;
  currency?: string;
  sort_order?: number;
  is_featured?: boolean;
};

export async function createProduct(
  input: CreateProductInput
): Promise<ActionResult<Product>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const nameAr = input.name_ar?.trim();
  if (!input.category_id || !nameAr) {
    return fail("التصنيف والاسم العربي مطلوبان");
  }
  if (input.price == null || input.price < 0) {
    return fail("السعر يجب أن يكون صفراً أو أكبر");
  }
  if (input.old_price != null && input.old_price < 0) {
    return fail("السعر السابق غير صالح");
  }

  const restaurantId = await getRestaurantIdByCategory(
    auth.supabase,
    input.category_id
  );
  if (!restaurantId) return fail("التصنيف غير موجود");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بإنشاء منتج");
  }

  const { data, error } = await auth.supabase
    .from("products")
    .insert({
      category_id: input.category_id,
      name_ar: nameAr,
      name_en: input.name_en ?? null,
      description_ar: input.description_ar ?? null,
      description_en: input.description_en ?? null,
      price: input.price,
      old_price: input.old_price ?? null,
      currency: input.currency ?? "SYP",
      sort_order: input.sort_order ?? 0,
      is_featured: input.is_featured ?? false,
      status: "AVAILABLE",
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Product);
}
