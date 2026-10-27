"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { SocialLink } from "@/modules/operations/types";

export async function getSocialLink(
  restaurantId: string
): Promise<ActionResult<SocialLink[]>> {
  if (!restaurantId) return fail("معرّف المطعم مطلوب");
  return run(() => apiData<SocialLink[]>(`/restaurants/${restaurantId}/social-links`));
}

export type CreateSocialLinkInput = {
  restaurant_id: string;
  platform: string;
  url: string;
  sort_order?: number;
};

export async function createSocialLink(
  input: CreateSocialLinkInput
): Promise<ActionResult<SocialLink>> {
  const { restaurant_id: restaurantId, ...body } = input;
  if (!restaurantId) return fail("معرّف المطعم مطلوب");
  if (!body.platform || !body.url?.trim()) return fail("المنصة والرابط مطلوبان");

  return run(() =>
    apiData<SocialLink>(`/restaurants/${restaurantId}/social-links`, {
      method: "POST",
      body,
    })
  );
}

export type UpdateSocialLinkInput = {
  id: string;
  restaurant_id: string;
  platform?: string;
  url?: string;
  sort_order?: number;
};

export async function updateSocialLink(
  input: UpdateSocialLinkInput
): Promise<ActionResult<SocialLink>> {
  const { id, restaurant_id: restaurantId, ...changes } = input;
  if (!id || !restaurantId) return fail("بيانات الرابط غير مكتملة");

  return run(() =>
    apiData<SocialLink>(`/restaurants/${restaurantId}/social-links/${id}`, {
      method: "PATCH",
      body: changes,
    })
  );
}

export async function updateSocialLinkStatus(
  id: string,
  restaurantId: string,
  isActive: boolean
): Promise<ActionResult<SocialLink>> {
  if (!id || !restaurantId) return fail("بيانات الرابط غير مكتملة");

  return run(() =>
    apiData<SocialLink>(`/restaurants/${restaurantId}/social-links/${id}/status`, {
      method: "PATCH",
      body: { is_active: isActive },
    })
  );
}
