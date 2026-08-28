"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";

export async function markAllNotificationsRead(): Promise<
  ActionResult<{ success: true }>
> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const { error } = await auth.supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", auth.user.id)
    .eq("is_read", false);

  if (error) return fail(error.message);
  return ok({ success: true });
}
