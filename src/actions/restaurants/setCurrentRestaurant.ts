"use server";

import { cookies } from "next/headers";
import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import { RESTAURANT_COOKIE } from "@/lib/config";

export async function setCurrentRestaurant(
  restaurantId: string
): Promise<ActionResult<{ success: true }>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  const { data } = await auth.supabase
    .from("restaurant_users")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", auth.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return fail("ليس لديك صلاحية على هذا المطعم");

  const cookieStore = await cookies();
  cookieStore.set(RESTAURANT_COOKIE, restaurantId, {
    path: "/",
    sameSite: "lax",
  });

  return ok({ success: true });
}
