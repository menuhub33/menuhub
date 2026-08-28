"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { Plan } from "@/lib/types";

export type GetPlanInput = {
  id?: string;
  slug?: string;
};

export async function getPlan(
  input: GetPlanInput = {}
): Promise<ActionResult<Plan | Plan[]>> {
  const supabase = await createClient();

  if (input.id || input.slug) {
    let query = supabase.from("plans").select("*");
    if (input.id) query = query.eq("id", input.id);
    if (input.slug) query = query.eq("slug", input.slug);

    const { data, error } = await query.single();
    if (error) return fail(error.message);
    return ok(data as Plan);
  }

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price_monthly", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as Plan[]);
}
