"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { CustomDomain, DomainStatus } from "@/lib/types";

export async function updateDomainStatus(
  id: string,
  restaurantId: string,
  status: DomainStatus
): Promise<ActionResult<CustomDomain>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id || !restaurantId) return fail("معرّف النطاق والمطعم مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    restaurantId,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه تغيير حالة النطاق");
  }

  const payload: Record<string, unknown> = { status };
  if (status === "ACTIVE") payload.verified_at = new Date().toISOString();

  const { data, error } = await auth.supabase
    .from("custom_domains")
    .update(payload)
    .eq("id", id)
    .eq("restaurant_id", restaurantId)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as CustomDomain);
}
