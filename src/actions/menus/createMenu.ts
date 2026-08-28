"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  isValidSlug,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Menu } from "@/lib/types";

export type CreateMenuInput = {
  restaurant_id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_default?: boolean;
};

export async function createMenu(
  input: CreateMenuInput
): Promise<ActionResult<Menu>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const name = input.name?.trim();
  const slug = input.slug?.trim().toLowerCase();

  if (!input.restaurant_id || !name || !slug) {
    return fail("المطعم والاسم والمعرّف مطلوبون");
  }
  if (!isValidSlug(slug)) return fail("صيغة المعرّف غير صحيحة");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])) {
    return fail("غير مصرح لك بإنشاء قائمة");
  }

  if (input.is_default) {
    await auth.supabase
      .from("menus")
      .update({ is_default: false })
      .eq("restaurant_id", input.restaurant_id)
      .eq("is_default", true);
  }

  const { data, error } = await auth.supabase
    .from("menus")
    .insert({
      restaurant_id: input.restaurant_id,
      name,
      slug,
      description: input.description ?? null,
      is_default: input.is_default ?? false,
      status: "DRAFT",
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Menu);
}
