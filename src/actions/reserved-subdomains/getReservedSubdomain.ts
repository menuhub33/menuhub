"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { ReservedSubdomain } from "@/lib/types";

export async function getReservedSubdomain(): Promise<
  ActionResult<ReservedSubdomain[]>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reserved_subdomains")
    .select("*")
    .order("slug", { ascending: true });

  if (error) return fail(error.message);
  return ok((data ?? []) as ReservedSubdomain[]);
}
