"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Notification } from "@/lib/types";

export async function updateNotificationStatus(
  id: string,
  isRead: boolean
): Promise<ActionResult<Notification>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!id) return fail("معرّف الإشعار مطلوب");

  const { data, error } = await auth.supabase
    .from("notifications")
    .update({ is_read: isRead })
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Notification);
}
