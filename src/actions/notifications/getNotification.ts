"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Notification } from "@/lib/types";

export type GetNotificationInput = {
  restaurant_id?: string;
  unread_only?: boolean;
};

export async function getNotification(
  input: GetNotificationInput = {}
): Promise<ActionResult<Notification[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  let query = auth.supabase
    .from("notifications")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (input.restaurant_id) {
    query = query.eq("restaurant_id", input.restaurant_id);
  }
  if (input.unread_only) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return fail(error.message);
  return ok((data ?? []) as Notification[]);
}
