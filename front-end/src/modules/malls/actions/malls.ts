"use server";

import { cache } from "react";
import { apiAll, apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { Mall, MallStatus, MallTheme, PublicMallState } from "@/modules/malls/types";

export async function getAdminMalls(): Promise<ActionResult<Mall[]>> {
  return run(() => apiAll<Mall>("/admin/malls"));
}

export async function getMyMall(): Promise<ActionResult<Mall>> {
  return run(() => apiData<Mall>("/admin/mall"));
}

export async function getAdminMall(id: string): Promise<ActionResult<Mall>> {
  if (!id) return fail("معرّف المول مطلوب");
  return run(() => apiData<Mall>(`/admin/malls/${id}`));
}

export async function getMyMallTheme(): Promise<ActionResult<MallTheme>> {
  return run(() => apiData<MallTheme>("/admin/mall/theme"));
}

export async function updateMyMallTheme(
  input: Partial<MallTheme>
): Promise<ActionResult<MallTheme>> {
  return run(() => apiData<MallTheme>("/admin/mall/theme", { method: "PATCH", body: input }));
}

export async function getAdminMallTheme(id: string): Promise<ActionResult<MallTheme>> {
  if (!id) return fail("معرّف المول مطلوب");
  return run(() => apiData<MallTheme>(`/admin/malls/${id}/theme`));
}

export async function updateAdminMallTheme(
  id: string,
  input: Partial<MallTheme>
): Promise<ActionResult<MallTheme>> {
  if (!id) return fail("معرّف المول مطلوب");
  return run(() => apiData<MallTheme>(`/admin/malls/${id}/theme`, { method: "PATCH", body: input }));
}

export async function adminCreateMall(input: {
  name: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  manager?: { fullName: string; email: string; password: string };
}): Promise<ActionResult<Mall>> {
  const name = input.name.trim();
  if (!name) return fail("اسم المول مطلوب");
  const manager = input.manager;
  if (manager && (manager.password.length < 8 || !manager.email.trim() || !manager.fullName.trim())) {
    return fail("اسم مدير المول وبريده وكلمة مرور من 8 أحرف مطلوبة");
  }

  return run(() =>
    apiData<Mall>("/admin/malls", {
      method: "POST",
      body: {
        name,
        slug: input.slug?.trim().toLowerCase() || undefined,
        description: input.description || null,
        phone: input.phone || null,
        address: input.address || null,
        manager: manager
          ? {
              full_name: manager.fullName.trim(),
              email: manager.email.trim().toLowerCase(),
              password: manager.password,
            }
          : undefined,
      },
    })
  );
}

export async function adminUpdateMall(input: {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  status: MallStatus;
}): Promise<ActionResult<Mall>> {
  if (!input.id) return fail("معرّف المول مطلوب");
  return run(() =>
    apiData<Mall>(`/admin/malls/${input.id}`, {
      method: "PATCH",
      body: {
        name: input.name.trim(),
        slug: input.slug.trim().toLowerCase(),
        description: input.description || null,
        phone: input.phone || null,
        address: input.address || null,
        cover_image_url: input.cover_image_url || null,
        logo_url: input.logo_url || null,
        status: input.status,
      },
    })
  );
}

export async function updateMyMall(input: {
  name: string;
  slug: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  cover_image_url?: string | null;
  logo_url?: string | null;
  status: MallStatus;
}): Promise<ActionResult<Mall>> {
  if (!input.name.trim() || !input.slug.trim()) return fail("الاسم والرابط مطلوبان");
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    slug: input.slug.trim().toLowerCase(),
    status: input.status,
  };
  if (input.description !== undefined) body.description = input.description || null;
  if (input.phone !== undefined) body.phone = input.phone || null;
  if (input.address !== undefined) body.address = input.address || null;
  if (input.cover_image_url !== undefined) body.cover_image_url = input.cover_image_url || null;
  if (input.logo_url !== undefined) body.logo_url = input.logo_url || null;

  return run(() => apiData<Mall>("/admin/mall", { method: "PATCH", body }));
}

export async function adminDeleteMall(id: string): Promise<ActionResult<{ success: true }>> {
  if (!id) return fail("معرّف المول مطلوب");
  return run(async () => {
    await apiData(`/admin/malls/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

const loadPublicMall = cache(async (slug: string): Promise<ActionResult<PublicMallState>> =>
  run(() => apiData<PublicMallState>(`/public/malls/${encodeURIComponent(slug)}`, { auth: false }))
);

export async function getPublicMall(slug: string): Promise<ActionResult<PublicMallState>> {
  const normalized = slug?.trim().toLowerCase();
  if (!normalized) return fail("المعرّف مطلوب");
  return loadPublicMall(normalized);
}
