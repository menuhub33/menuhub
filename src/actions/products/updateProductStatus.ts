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
import type { Product, ProductStatus } from "@/lib/types";

export async function updateProductStatus(
  id: string,
  status: ProductStatus
): Promise<ActionResult<Product>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف المنتج مطلوب");

  const restaurantId = await getRestaurantIdByProduct(auth.supabase, id);
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
    return fail("غير مصرح لك بتغيير حالة المنتج");
  }

  const { data, error } = await auth.supabase
    .from("products")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Product);
}
