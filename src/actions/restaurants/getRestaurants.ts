"use server";

import { fail, ok, requireUser, type ActionResult } from "@/lib/action";
import type { Restaurant } from "@/lib/types";

export async function getRestaurants(): Promise<ActionResult<Restaurant[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const { data: memberships, error: membershipError } = await auth.supabase
    .from("restaurant_users")
    .select("restaurant_id")
    .eq("user_id", auth.user.id)
    .eq("is_active", true);

  if (membershipError) return fail(membershipError.message);

  const ids = (memberships ?? []).map((row) => row.restaurant_id as string);
  if (ids.length === 0) return ok([]);

  const { data, error } = await auth.supabase
    .from("restaurants")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []) as Restaurant[]);
}
