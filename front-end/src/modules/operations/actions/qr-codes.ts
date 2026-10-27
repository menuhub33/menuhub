"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { QrCode } from "@/modules/operations/types";

export type GetQrCodeInput = {
  restaurant_id: string;
};

export async function getQrCode(
  input: GetQrCodeInput
): Promise<ActionResult<QrCode[]>> {
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");
  return run(() => apiData<QrCode[]>(`/restaurants/${input.restaurant_id}/qr-codes`));
}

export type CreateQrCodeInput = {
  restaurant_id: string;
  menu_id?: string | null;
  name: string;
  branch_id?: string | null;
  logo_enabled?: boolean;
  format?: string;
  size?: number;
};

/** The API builds the code image and the target address itself. */
export async function createQrCode(
  input: CreateQrCodeInput
): Promise<ActionResult<QrCode>> {
  const { restaurant_id: restaurantId, ...body } = input;
  if (!restaurantId) return fail("معرّف المطعم مطلوب");
  if (!body.name?.trim()) return fail("اسم الرمز مطلوب");

  return run(() =>
    apiData<QrCode>(`/restaurants/${restaurantId}/qr-codes`, {
      method: "POST",
      body: { ...body, name: body.name.trim(), format: body.format?.toUpperCase() },
    })
  );
}

export async function deleteQrCode(
  id: string,
  restaurantId: string
): Promise<ActionResult<{ success: true }>> {
  if (!id || !restaurantId) return fail("بيانات الرمز غير مكتملة");

  return run(async () => {
    await apiData(`/restaurants/${restaurantId}/qr-codes/${id}`, { method: "DELETE" });
    return { success: true as const };
  });
}
