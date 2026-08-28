"use server";

import {
  fail,
  getRestaurantMembership,
  ok,
  requireUser,
  type ActionResult,
} from "@/lib/action";
import type { QrCode } from "@/lib/types";

export type CreateQrCodeInput = {
  restaurant_id: string;
  menu_id: string;
  name: string;
  qr_url: string;
  branch_id?: string | null;
  logo_enabled?: boolean;
  format?: string;
};

export async function createQrCode(
  input: CreateQrCodeInput
): Promise<ActionResult<QrCode>> {
  const auth = await requireUser();
  if (auth.error || !auth.user) return fail(auth.error ?? "غير مصرح");

  const name = input.name?.trim();
  if (!input.restaurant_id || !input.menu_id || !name || !input.qr_url) {
    return fail("المطعم والقائمة والاسم ورابط QR مطلوبون");
  }

  const membership = await getRestaurantMembership(
    auth.supabase,
    input.restaurant_id,
    auth.user.id
  );
  if (!membership) return fail("غير مصرح لك بإنشاء رمز QR");

  const { data, error } = await auth.supabase
    .from("qr_codes")
    .insert({
      restaurant_id: input.restaurant_id,
      menu_id: input.menu_id,
      name,
      qr_url: input.qr_url,
      branch_id: input.branch_id ?? null,
      logo_enabled: input.logo_enabled ?? false,
      format: input.format ?? "PNG",
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return ok(data as QrCode);
}
