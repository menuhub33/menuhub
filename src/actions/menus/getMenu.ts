"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Menu } from "@/lib/types";

export type GetMenuInput = {
  id?: string;
  restaurant_id?: string;
  slug?: string;
};

export async function getMenu(
  input: GetMenuInput
): Promise<ActionResult<Menu | Menu[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("menus")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as Menu);
  }

  if (!input.restaurant_id) return fail("معرّف القائمة أو المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض قوائم هذا المطعم");

  let query = auth.supabase
    .from("menus")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: true });

  if (input.slug) query = query.eq("slug", input.slug);

  const { data, error } = await query;
  if (error) return fail(error.message);

  if (input.slug) {
    const menu = (data ?? [])[0];
    if (!menu) return fail("القائمة غير موجودة");
    return ok(menu as Menu);
  }

  return ok((data ?? []) as Menu[]);
}
