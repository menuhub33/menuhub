"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";

export async function logout(): Promise<ActionResult<{ success: true }>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) return fail(error.message);

  return ok({ success: true });
}
