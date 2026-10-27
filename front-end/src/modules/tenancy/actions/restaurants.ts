"use server";

import { cookies } from "next/headers";
import { apiData, run } from "@/core/api/client";
import { fail, ok, type ActionResult } from "@/core/api/result";
import { getMemberships } from "@/core/auth/authorization";
import { RESTAURANT_COOKIE } from "@/core/config";
import type { Restaurant } from "@/modules/tenancy/types";

export type UpdateRestaurantInput = {
  id: string;
  name?: string;
  slug?: string;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string;
  default_language?: string;
  currency?: string;
  /** Ignored: the menu status is owned by the menu publish/unpublish endpoints. */
  menu_status?: Restaurant["menu_status"];
  delivery_enabled?: boolean;
  chatbot_enabled?: boolean;
  chatbot_name?: string | null;
  chatbot_welcome?: string | null;
};

export async function updateRestaurant(
  input: UpdateRestaurantInput
): Promise<ActionResult<Restaurant>> {
  const { id, menu_status: _ignored, ...changes } = input;
  void _ignored;
  if (!id) return fail("معرّف المطعم مطلوب");

  if (changes.name !== undefined && !changes.name.trim()) {
    return fail("اسم المطعم مطلوب");
  }

  // Nothing but `menu_status` was sent: the API call would be a no-op.
  if (Object.keys(changes).length === 0) {
    return run(async () => (await apiData<{ restaurant: Restaurant }>(`/restaurants/${id}`)).restaurant);
  }

  return run(() =>
    apiData<Restaurant>(`/restaurants/${id}`, { method: "PATCH", body: changes })
  );
}

/** Remembers which restaurant the dashboard works on (restaurant switcher). */
export async function setCurrentRestaurant(
  restaurantId: string
): Promise<ActionResult<{ success: true }>> {
  const memberships = await getMemberships();
  if (!memberships.some((item) => item.restaurant.id === restaurantId)) {
    return fail("غير مصرح لك بالوصول إلى هذا المطعم");
  }

  (await cookies()).set(RESTAURANT_COOKIE, restaurantId, {
    path: "/",
    sameSite: "lax",
  });
  return ok({ success: true });
}

export async function checkSlugAvailable(
  slug: string
): Promise<ActionResult<{ available: boolean }>> {
  const value = slug?.trim().toLowerCase();
  if (!value) return fail("الرابط مطلوب");

  return run(async () => {
    const data = await apiData<{ available: boolean }>("/slugs/check", {
      auth: false,
      query: { slug: value },
    });
    return { available: Boolean(data?.available) };
  });
}
