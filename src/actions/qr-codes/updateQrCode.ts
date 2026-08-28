"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { QrCode } from "@/lib/types";

export type UpdateQrCodeInput = {
  id: string;
  restaurant_id: string;
  name?: string;
  qr_url?: string;
  logo_enabled?: boolean;
  format?: string;
  branch_id?: string | null;
};

export async function updateQrCode(
  input: UpdateQrCodeInput
): Promise<ActionResult<QrCode>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");
  if (!input.id || !input.restaurant_id) {
    return fail("معرّف رمز QR والمطعم مطلوبان");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بتعديل رمز QR");

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.qr_url !== undefined) payload.qr_url = input.qr_url;
  if (input.logo_enabled !== undefined) payload.logo_enabled = input.logo_enabled;
  if (input.format !== undefined) payload.format = input.format;
  if (input.branch_id !== undefined) payload.branch_id = input.branch_id;

  const { data, error } = await auth.supabase
    .from("qr_codes")
    .update(payload)
    .eq("id", input.id)
    .eq("restaurant_id", input.restaurant_id)
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as QrCode);
}
