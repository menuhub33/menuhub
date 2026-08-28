"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { RestaurantUser } from "@/lib/types";

export async function getRestaurantUsers(
  restaurantId: string
): Promise<ActionResult<RestaurantUser[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership) return fail("غير مصرح لك بعرض أعضاء هذا المطعم");

  const { data, error } = await auth.supabase
    .from("restaurant_users")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as RestaurantUser[]);
}
