"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { QrCode } from "@/lib/types";

export type GetQrCodeInput = {
  id?: string;
  restaurant_id?: string;
};

export async function getQrCode(
  input: GetQrCodeInput
): Promise<ActionResult<QrCode | QrCode[]>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  if (input.id) {
    const { data, error } = await auth.supabase
      .from("qr_codes")
      .select("*")
      .eq("id", input.id)
      .single();

    if (error) return fail(error.message);
    return ok(data as QrCode);
  }

  if (!input.restaurant_id) return fail("معرّف رمز QR أو المطعم مطلوب");

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بعرض رموز QR");

  const { data, error } = await auth.supabase
    .from("qr_codes")
    .select("*")
    .eq("restaurant_id", input.restaurant_id)
    .order("created_at", { ascending: false });

  if (error) return fail(error.message);
  return ok((data ?? []) as QrCode[]);
}
