import { cache } from "react";
import { ApiError, apiData } from "@/core/api/client";
import { getToken } from "@/core/auth/token";
import type { Profile } from "@/modules/auth/types";

export type AuthSession = {
  user: { id: string; email: string; email_verified_at?: string | null };
  profile: Profile;
};

/**
 * The signed-in account (`GET /auth/me`), memoised for the current request.
 * `null` when there is no token or the API rejected it (expired / revoked).
 */
export const getSession = cache(async (): Promise<AuthSession | null> => {
  if (!(await getToken())) return null;

  try {
    const profile = await apiData<Profile>("/auth/me");
    if (!profile) return null;
    return {
      user: {
        id: profile.id,
        email: profile.email,
        email_verified_at: profile.email_verified_at,
      },
      profile,
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
});

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function getUserRole() {
  const session = await getSession();
  return session?.profile.platform_role ?? null;
}
