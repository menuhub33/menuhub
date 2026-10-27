"use server";

import { apiPage, apiData, run } from "@/core/api/client";
import type { ActionResult } from "@/core/api/result";
import type { Notification } from "@/modules/notifications/types";

export type GetNotificationInput = {
  restaurant_id?: string;
  unread_only?: boolean;
  limit?: number;
};

export async function getNotification(
  input: GetNotificationInput = {}
): Promise<ActionResult<Notification[]>> {
  return run(async () => {
    const page = await apiPage<Notification>("/notifications", {
      query: {
        restaurant_id: input.restaurant_id,
        unread: input.unread_only ? 1 : undefined,
        per_page: input.limit ?? 20,
      },
    });
    return page.items;
  });
}

export async function markAllNotificationsRead(): Promise<
  ActionResult<{ success: true }>
> {
  return run(async () => {
    await apiData("/notifications/read-all", { method: "POST" });
    return { success: true as const };
  });
}

export async function markNotificationRead(
  id: string
): Promise<ActionResult<Notification>> {
  return run(() => apiData<Notification>(`/notifications/${id}/read`, { method: "PATCH" }));
}
