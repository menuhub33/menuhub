"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, isSlugReserved, isValidSlug, ok, type ActionResult } from "@/lib/action";

export async function checkSlugAvailable(
  slug: string
): Promise<ActionResult<{ available: boolean }>> {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return fail("المعرّف مطلوب");
  if (!isValidSlug(normalized)) {
    return ok({ available: false });
  }

  const supabase = await createClient();

  if (await isSlugReserved(supabase, normalized)) {
    return ok({ available: false });
  }

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id")
    .eq("slug", normalized)
    .maybeSingle();

  return ok({ available: !restaurant });
}
