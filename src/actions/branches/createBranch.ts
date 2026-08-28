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
import type { Branch } from "@/lib/types";

export type CreateBranchInput = {
  restaurant_id: string;
  name: string;
  slug: string;
  phone?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export async function createBranch(
  input: CreateBranchInput
): Promise<ActionResult<Branch>> {
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
    return fail("غير مصرح لك بإنشاء فرع");
  }

  const { data, error } = await auth.supabase
    .from("branches")
    .insert({
      restaurant_id: input.restaurant_id,
      name,
      slug,
      phone: input.phone ?? null,
      address: input.address ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Branch);
}
