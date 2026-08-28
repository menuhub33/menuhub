"use server";

import {
  fail,
  getRestaurantMembership,
  hasRestaurantRole,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { Notification } from "@/lib/types";

export type CreateNotificationInput = {
  user_id: string;
  title: string;
  message: string;
  type: string;
  restaurant_id?: string | null;
};

export async function createNotification(
  input: CreateNotificationInput
): Promise<ActionResult<Notification>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const title = input.title?.trim();
  const message = input.message?.trim();
  const type = input.type?.trim();

  if (!input.user_id || !title || !message || !type) {
    return fail("المستخدم والعنوان والرسالة والنوع مطلوبون");
  }

  if (input.restaurant_id) {
    const membership = await getRestaurantMembership(
      auth.supabase,
      input.restaurant_id,
      auth.user.id
    );

    if (
      !membership ||
      !hasRestaurantRole(membership.role, ["OWNER", "MANAGER"])
    ) {
      return fail("غير مصرح لك بإرسال إشعار لهذا المطعم");
    }
  } else if (input.user_id !== auth.user.id) {
    return fail("غير مصرح لك بإرسال إشعار لهذا المستخدم");
  }

  const { data, error } = await auth.supabase
    .from("notifications")
    .insert({
      user_id: input.user_id,
      restaurant_id: input.restaurant_id ?? null,
      type,
      title,
      message,
      is_read: false,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Notification);
}
