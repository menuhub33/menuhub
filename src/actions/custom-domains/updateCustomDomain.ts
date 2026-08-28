"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { CustomDomain } from "@/lib/types";

export type UpdateCustomDomainInput = {
  id: string;
  restaurant_id: string;
  domain?: string;
  ssl_status?: string | null;
};

export async function updateCustomDomain(
  input: UpdateCustomDomainInput
): Promise<ActionResult<CustomDomain>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف النطاق والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تعديل النطاق");
  }

  const payload: Record<string, unknown> = {};
  if (input.domain !== undefined) payload.domain = input.domain.trim().toLowerCase();
  if (input.ssl_status !== undefined) payload.ssl_status = input.ssl_status;

  const { data, error } = await auth.supabase
    .from("custom_domains")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as CustomDomain);
}
