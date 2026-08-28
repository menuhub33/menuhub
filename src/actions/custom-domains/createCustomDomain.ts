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

export type CreateCustomDomainInput = {
  restaurant_id: string;
  domain: string;
};

export async function createCustomDomain(
  input: CreateCustomDomainInput
): Promise<ActionResult<CustomDomain>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const domain = input.domain?.trim().toLowerCase();
  if (!input.restaurant_id || !domain) return fail("المطعم والنطاق مطلوبان");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );

  if (!membership || !hasRestaurantRole(membership.role, ["OWNER"])) {
    return fail("فقط المالك يمكنه إضافة نطاق مخصص");
  }

  const verificationToken = crypto.randomUUID().replaceAll("-", "");

  const { data, error } = await auth.supabase
    .from("custom_domains")
    .insert({
      restaurant_id: input.restaurant_id,
      domain,
      status: "PENDING",
      verification_token: verificationToken,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as CustomDomain);
}
