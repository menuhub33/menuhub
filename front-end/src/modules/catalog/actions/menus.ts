"use server";

import { apiData, run } from "@/core/api/client";
import { requireTenantId } from "@/core/auth/authorization";
import { fail, type ActionResult } from "@/core/api/result";
import type { Menu, MenuStatus } from "@/modules/catalog/types";

export type GetMenuInput = {
  id?: string;
  restaurant_id?: string;
};

export async function getMenu(
  input: GetMenuInput
): Promise<ActionResult<Menu | Menu[]>> {
  return run(async () => {
    const restaurantId = input.restaurant_id ?? (await requireTenantId());
    if (input.id) {
      return apiData<Menu>(`/restaurants/${restaurantId}/menus/${input.id}`);
    }
    return apiData<Menu[]>(`/restaurants/${restaurantId}/menus`);
  });
}

/** Publishing / unpublishing also updates `restaurants.menu_status` in the API. */
export async function updateMenuStatus(
  id: string,
  restaurantId: string,
  status: MenuStatus
): Promise<ActionResult<Menu>> {
  if (!id || !restaurantId) return fail("بيانات القائمة غير مكتملة");
  if (status === "DRAFT") return fail("لا يمكن إعادة القائمة إلى حالة المسودة");

  const action = status === "PUBLISHED" ? "publish" : "unpublish";
  return run(() =>
    apiData<Menu>(`/restaurants/${restaurantId}/menus/${id}/${action}`, { method: "POST" })
  );
}
