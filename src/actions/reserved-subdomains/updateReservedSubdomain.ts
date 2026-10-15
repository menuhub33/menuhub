"use server";

import { revalidatePath } from "next/cache";
import {
  fail,
  isValidSlug,
  ok,
  requirePlatformAdmin,
  type ActionResult,
} from "@/lib/action";
import type { ReservedSubdomain } from "@/lib/types";

export async function updateReservedSubdomain(
  id: string,
  slug: string
): Promise<ActionResult<ReservedSubdomain>> {
  const auth = await requirePlatformAdmin();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const normalized = slug?.trim().toLowerCase();
  if (!id) return fail("المعرّف مطلوب");
  if (!normalized) return fail("النطاق الفرعي مطلوب");
  if (!isValidSlug(normalized)) return fail("صيغة المعرّف غير صحيحة");

  const { data: taken } = await auth.supabase
    .from("reserved_subdomains")
    .select("id")
    .eq("slug", normalized)
    .neq("id", id)
    .maybeSingle();
  if (taken) return fail("هذا النطاق محجوز مسبقاً");

  const { data, error } = await auth.supabase
    .from("reserved_subdomains")
    .update({ slug: normalized })
    .eq("id", id)
    .select()
    .single();

  if (error) return fail(error.message);
  revalidatePath("/admin/settings");
  return ok(data as ReservedSubdomain);
}
