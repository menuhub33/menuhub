"use server";

import {
  fail,
  getRestaurantIdByProduct,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Product } from "@/lib/types";

export type UpdateProductInput = {
  id: string;
  category_id?: string;
  name_ar?: string;
  name_en?: string | null;
  description_ar?: string | null;
  description_en?: string | null;
  price?: number;
  old_price?: number | null;
  currency?: string;
  sort_order?: number;
  is_featured?: boolean;
  status?: Product["status"];
};

export async function updateProduct(
  input: UpdateProductInput
): Promise<ActionResult<Product>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف المنتج مطلوب");

  const restaurantId = await getRestaurantIdByProduct(auth.supabase, input.id);
  if (!restaurantId) return fail("المنتج غير موجود");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (
    !membership ||
    !hasRestaurantRole(membership.role, ["OWNER", "MANAGER", "EDITOR"])
  ) {
    return fail("غير مصرح لك بتعديل المنتج");
  }

  if (input.price != null && input.price < 0) {
    return fail("السعر يجب أن يكون صفراً أو أكبر");
  }
  if (input.old_price != null && input.old_price < 0) {
    return fail("السعر السابق غير صالح");
  }

  const payload: Record<string, unknown> = {};
  if (input.category_id !== undefined) payload.category_id = input.category_id;
  if (input.name_ar !== undefined) payload.name_ar = input.name_ar.trim();
  if (input.name_en !== undefined) payload.name_en = input.name_en;
  if (input.description_ar !== undefined) {
    payload.description_ar = input.description_ar;
  }
  if (input.description_en !== undefined) {
    payload.description_en = input.description_en;
  }
  if (input.price !== undefined) payload.price = input.price;
  if (input.old_price !== undefined) payload.old_price = input.old_price;
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.sort_order !== undefined) payload.sort_order = input.sort_order;
  if (input.is_featured !== undefined) payload.is_featured = input.is_featured;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await auth.supabase
    .from("products")
    .update(payload)
    .eq("id", input.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Product);
}
