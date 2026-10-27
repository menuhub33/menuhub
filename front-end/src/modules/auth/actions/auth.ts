"use server";

import { cookies } from "next/headers";
import { apiData, run } from "@/core/api/client";
import { fail, type ActionResult } from "@/core/api/result";
import { RESTAURANT_COOKIE } from "@/core/config";
import { clearToken, getToken, setToken } from "@/core/auth/token";
import type { PlatformRole, Profile } from "@/modules/auth/types";

export type LoginInput = {
  email: string;
  password: string;
};

export async function login(
  input: LoginInput
): Promise<ActionResult<{ userId: string; platformRole: PlatformRole }>> {
  const email = input.email?.trim().toLowerCase();

  if (!email || !input.password) {
    return fail("البريد الإلكتروني وكلمة المرور مطلوبان");
  }

  return run(async () => {
    const data = await apiData<{ user: Profile; token: string }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password: input.password, device_name: "web" },
    });

    await setToken(data.token);
    return { userId: data.user.id, platformRole: data.user.platform_role };
  });
}

export async function logout(): Promise<ActionResult<{ success: true }>> {
  // Revoke the token on the server, but always drop the local session even if
  // the API is unreachable or the token is already invalid.
  if (await getToken()) {
    await run(() => apiData("/auth/logout", { method: "POST" }));
  }
  await clearToken();
  (await cookies()).delete(RESTAURANT_COOKIE);
  return { data: { success: true }, error: null };
}

export type RegisterInput = {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  restaurant_name?: string;
};

export async function register(
  input: RegisterInput
): Promise<ActionResult<{ userId: string; needsEmailVerification: boolean }>> {
  const email = input.email?.trim().toLowerCase();
  const fullName = input.full_name?.trim();

  if (!email || !input.password || !fullName) {
    return fail("الاسم والبريد الإلكتروني وكلمة المرور مطلوبة");
  }
  if (input.password.length < 8) {
    return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  return run(async () => {
    const data = await apiData<{
      user: Profile;
      token: string | null;
      email_verification_required: boolean;
    }>("/auth/register", {
      method: "POST",
      auth: false,
      body: {
        full_name: fullName,
        email,
        password: input.password,
        phone: input.phone?.trim() || null,
        device_name: "web",
      },
    });

    if (data.token) await setToken(data.token);
    return {
      userId: data.user.id,
      needsEmailVerification: data.email_verification_required || !data.token,
    };
  });
}

export async function forgotPassword(
  email: string
): Promise<ActionResult<{ success: true }>> {
  const value = email?.trim().toLowerCase();
  if (!value) return fail("البريد الإلكتروني مطلوب");

  return run(async () => {
    await apiData("/auth/forgot-password", {
      method: "POST",
      auth: false,
      body: { email: value },
    });
    return { success: true as const };
  });
}

export type ResetPasswordInput = {
  token: string;
  email: string;
  password: string;
};

export async function resetPassword(
  input: ResetPasswordInput
): Promise<ActionResult<{ success: true }>> {
  if (!input.token || !input.email) {
    return fail("رابط الاستعادة غير صالح. اطلب رابطاً جديداً");
  }
  if (!input.password || input.password.length < 8) {
    return fail("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
  }

  return run(async () => {
    await apiData("/auth/reset-password", {
      method: "POST",
      auth: false,
      body: {
        token: input.token,
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    });
    return { success: true as const };
  });
}

export async function changePassword(input: {
  current_password: string;
  password: string;
}): Promise<ActionResult<{ success: true }>> {
  if (!input.current_password || !input.password || input.password.length < 8) {
    return fail("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل");
  }

  return run(async () => {
    await apiData("/auth/password", { method: "PUT", body: input });
    return { success: true as const };
  });
}
