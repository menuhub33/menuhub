"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { ReservedSubdomain } from "@/modules/tenancy/types";

export async function getReservedSubdomain(): Promise<
  ActionResult<ReservedSubdomain[]>
> {
  return run(() => apiData<ReservedSubdomain[]>("/admin/reserved-subdomains"));
}

export async function createReservedSubdomain(
  slug: string
): Promise<ActionResult<ReservedSubdomain>> {
  const value = slug?.trim().toLowerCase();
  if (!value) return fail("النطاق الفرعي مطلوب");
  return run(() =>
    apiData<ReservedSubdomain>("/admin/reserved-subdomains", {
      method: "POST",
      body: { slug: value },
    })
  );
}

export async function updateReservedSubdomain(
  id: string,
  slug: string
): Promise<ActionResult<ReservedSubdomain>> {
  const value = slug?.trim().toLowerCase();
  if (!id || !value) return fail("بيانات النطاق غير مكتملة");
  return run(() =>
    apiData<ReservedSubdomain>(`/admin/reserved-subdomains/${id}`, {
      method: "PATCH",
      body: { slug: value },
    })
  );
}

export async function deleteReservedSubdomain(
  id: string
): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف النطاق مطلوب");
  return run(async () => {
    await apiData(`/admin/reserved-subdomains/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}
