"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { CustomDomain } from "@/lib/types";

export type GetCustomDomainInput = {
  id?: string;
  restaurant_id?: string;
};

export async function getCustomDomain(
  input: GetCustomDomainInput
): Promise<ActionResult<CustomDomain | CustomDomain[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("custom_domains")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as CustomDomain);
  }

  if (!input.restaurant_id) return fail("معرّف النطاق أو المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض النطاقات");

  const { data, error } = await auth.supabase
    .from("custom_domains")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []) as CustomDomain[]);
}
