"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Branch } from "@/lib/types";

export type GetBranchInput = {
  id?: string;
  restaurant_id?: string;
};

export async function getBranch(
  input: GetBranchInput
): Promise<ActionResult<Branch | Branch[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("branches")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as Branch);
  }

  if (!input.restaurant_id) return fail("معرّف الفرع أو المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض فروع هذا المطعم");

  const { data, error } = await auth.supabase
    .from("branches")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as Branch[]);
}
