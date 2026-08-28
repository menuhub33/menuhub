"use server";

import {
  fail,
  isValidSlug,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { ReservedSubdomain } from "@/lib/types";

export async function createReservedSubdomain(
  slug: string
): Promise<ActionResult<ReservedSubdomain>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return fail("المعرّف مطلوب");
  if (!isValidSlug(normalized)) return fail("صيغة المعرّف غير صحيحة");

  const { data, error } = await auth.supabase
    .from("reserved_subdomains")
    .insert({ slug: normalized })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as ReservedSubdomain);
}
