"use server";

import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import type { BusinessHours } from "@/modules/operations/types";

export type GetBusinessHoursInput = {
  restaurant_id: string;
  branch_id?: string | null;
};

export async function getBusinessHours(
  input: GetBusinessHoursInput
): Promise<ActionResult<BusinessHours[]>> {
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");

  return run(() =>
    apiData<BusinessHours[]>(`/restaurants/${input.restaurant_id}/business-hours`, {
      query: { branch_id: input.branch_id },
    })
  );
}

export type BusinessHoursDay = {
  day_of_week: number;
  is_closed: boolean;
  open_time?: string | null;
  close_time?: string | null;
};

/** The API replaces the whole weekly schedule in one call. */
export async function saveBusinessHours(input: {
  restaurant_id: string;
  branch_id?: string | null;
  hours: BusinessHoursDay[];
}): Promise<ActionResult<BusinessHours[]>> {
  if (!input.restaurant_id) return fail("معرّف المطعم مطلوب");
  if (input.hours.length === 0) return fail("حدد يوماً واحداً على الأقل");

  return run(() =>
    apiData<BusinessHours[]>(`/restaurants/${input.restaurant_id}/business-hours`, {
      method: "PUT",
      body: {
        branch_id: input.branch_id ?? null,
        hours: input.hours.map((day) => ({
          day_of_week: day.day_of_week,
          is_closed: day.is_closed,
          open_time: day.is_closed ? null : day.open_time?.slice(0, 5) ?? null,
          close_time: day.is_closed ? null : day.close_time?.slice(0, 5) ?? null,
        })),
      },
    })
  );
}
