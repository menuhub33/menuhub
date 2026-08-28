"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Notification } from "@/lib/types";

export type UpdateNotificationInput = {
  id: string;
  title?: string;
  message?: string;
};

export async function updateNotification(
  input: UpdateNotificationInput
): Promise<ActionResult<Notification>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id) return fail("معرّف الإشعار مطلوب");

  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.message !== undefined) payload.message = input.message.trim();

  const { data, error } = await auth.supabase
    .from("notifications")
    .update(payload)
    .eq("id", input.id)
    .eq("user_id", auth.user.id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as Notification);
}
