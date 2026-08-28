"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Restaurant } from "@/lib/types";

export type GetRestaurantInput = {
  id?: string;
  slug?: string;
};

export async function getRestaurant(
  input: GetRestaurantInput
): Promise<ActionResult<Restaurant>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id && !input.slug) return fail("معرّف المطعم أو الـ slug مطلوب");

  let query = auth.supabase.from("restaurants").select("*");

  if (input.id) query = query.eq("id", input.id);
  if (input.slug) query = query.eq("slug", input.slug);

  const { data, error } = await query.single();

  if (error) return fail(error.message);
  return ok(data as Restaurant);
}
