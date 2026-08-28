"use server";

import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "@/lib/action";
import type { PlatformRole } from "@/lib/types";

function mapAuthError(message: string, status?: number) {
  const value = message.toLowerCase();
  if (status === 429 || value.includes("rate")) {
    return "محاولات كثيرة. يرجى الانتظار ثم المحاولة مرة أخرى";
  }
  if (value.includes("email not confirmed") || value.includes("not confirmed")) {
    return "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول";
  }
  if (
    value.includes("invalid login") ||
    value.includes("invalid credentials") ||
    value.includes("invalid_credentials")
  ) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  }
  if (value.includes("network") || value.includes("fetch")) {
    return "تعذر الاتصال بالخادم. تحقق من الإنترنت ثم حاول مرة أخرى";
  }
  return "تعذر تسجيل الدخول. حاول مرة أخرى";
}

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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: input.password,
  });

  if (error) {
    return fail(mapAuthError(error.message, error.status));
  }
  if (!data.user) return fail("تعذر تسجيل الدخول");

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return fail("يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, platform_role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return fail("تم تعليق الحساب. تواصل مع الدعم لإعادة التفعيل");
  }

  return ok({
    userId: data.user.id,
    platformRole: (profile?.platform_role as PlatformRole | undefined) ?? "USER",
  });
}
