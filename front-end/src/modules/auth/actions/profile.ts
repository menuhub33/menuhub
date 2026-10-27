"use server";

import { apiData, run } from "@/core/api/client";
import type { ActionResult } from "@/core/api/result";
import type { Profile } from "@/modules/auth/types";

export type UpdateProfileInput = {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
};

export async function updateProfile(
  input: UpdateProfileInput
): Promise<ActionResult<Profile>> {
  const payload: UpdateProfileInput = {};

  if (input.full_name !== undefined) payload.full_name = input.full_name?.trim() || null;
  if (input.phone !== undefined) payload.phone = input.phone?.trim() || null;
  if (input.avatar_url !== undefined) payload.avatar_url = input.avatar_url;

  return run(() => apiData<Profile>("/auth/me", { method: "PATCH", body: payload }));
}
