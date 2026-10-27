"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { RestaurantRole, StaffMember } from "@/modules/tenancy/types";

type ApiStaff = {
  id: string;
  role: RestaurantRole;
  is_active: boolean;
  created_at: string;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

/** The UI keeps the `restaurant_users` + `profile` shape of the original app. */
function toStaffMember(restaurantId: string, item: ApiStaff): StaffMember {
  return {
    id: item.id,
    restaurant_id: restaurantId,
    user_id: item.user.id,
    role: item.role,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.created_at,
    profile: {
      id: item.user.id,
      full_name: item.user.full_name,
      phone: item.user.phone,
      avatar_url: null,
      platform_role: "USER",
      email: item.user.email,
    },
  };
}

export async function getStaff(
  restaurantId: string
): Promise<ActionResult<StaffMember[]>> {
  if (!restaurantId) return fail("معرّف المطعم مطلوب");

  return run(async () => {
    const rows = await apiData<ApiStaff[]>(`/restaurants/${restaurantId}/staff`);
    return rows.map((row) => toStaffMember(restaurantId, row));
  });
}

export type InviteStaffInput = {
  restaurant_id: string;
  email: string;
  role: RestaurantRole;
  /** Required by the API only when the e-mail has no account yet. */
  full_name?: string;
  password?: string;
};

export async function inviteStaff(
  input: InviteStaffInput
): Promise<ActionResult<{ success: true }>> {
  const email = input.email?.trim().toLowerCase();
  if (!input.restaurant_id || !email) return fail("البريد والمطعم مطلوبان");
  if (input.role === "OWNER") return fail("لا يمكن إضافة مالك آخر");

  return run(async () => {
    await apiData(`/restaurants/${input.restaurant_id}/staff`, {
      method: "POST",
      body: {
        email,
        role: input.role,
        full_name: input.full_name?.trim() || undefined,
        password: input.password || undefined,
      },
    });
    return { success: true as const };
  });
}

export async function removeStaff(input: {
  id: string;
  restaurant_id: string;
}): Promise<ActionResult<{ success: true }>> {
  if (!input.id || !input.restaurant_id) return fail("بيانات العضو غير مكتملة");

  return run(async () => {
    await apiData(`/restaurants/${input.restaurant_id}/staff/${input.id}`, { method: "DELETE" });
    return { success: true as const };
  });
}

export type UpdateRestaurantUserInput = {
  id: string;
  restaurant_id: string;
  role?: RestaurantRole;
  is_active?: boolean;
};

export async function updateRestaurantUser(
  input: UpdateRestaurantUserInput
): Promise<ActionResult<StaffMember>> {
  if (!input.id || !input.restaurant_id) return fail("بيانات العضو غير مكتملة");

  return run(async () => {
    const row = await apiData<ApiStaff>(
      `/restaurants/${input.restaurant_id}/staff/${input.id}`,
      {
        method: "PATCH",
        body: { role: input.role, is_active: input.is_active },
      }
    );
    return toStaffMember(input.restaurant_id, row);
  });
}
